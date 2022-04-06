const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


//IMPORTANT: Change to .env
const superSecretKey='testKeyChangeLater';


exports.login = (req, res) => {
    const {userName, password} = req.body;
    console.log(`authentication.js login`, userName, password);
    if (!userName || !password) {
        res.status(401).json({token: null});
        return;
    }

    let userId = -1;

    knex('users')
    .select('user_id', 'password')
    .where({
        user_name: userName
    })
    .then(info => {
        console.log('authentication.js login', info);
        if (!info.length) {
            res.status(401).json({token: null})
        }
        const passwordHash = info[0].password;
        userId = info[0].user_id;
        console.log('authentication.js login', 'userId', userId, 'passwordHash', passwordHash)
        const verified = bcrypt.compareSync(password, passwordHash);
        console.log('routes.js login verified', verified);

        if (verified) {
            let token = jwt.sign({username: userName, userid: userId}, superSecretKey);
            res.status(200).json({token: token, userId: userId});
            return;
        }

        res.status(401).json({token: null})
    })
}

function isNumeric(val) {
    
    return !isNaN(val.toString()) && 
           !isNaN(parseFloat(val.toString()))
  }

validateUrl = (view, userId, userName, pathname, res) => {
    console.log('authentication.js validateLeafurl', 'userId', userId, 'userName', userName, 'pathname', pathname)
    branchId = pathname.substring(3);

    console.log('authentication.js validateLeafurl', 'branchId', branchId);

    if (!isNumeric(branchId)) {
        return res.status(401).json({message: 'invalid branchId'})
    }

    branchId = Number(branchId);

    knex('branches')
    .select('tree_id')
    .where({
        branch_id: branchId
    })
    .then(info => {
        console.log('authentication.js validateLeafurl response from branches table', info);
        if (!info.length) {
            return res.status(401).json({message: 'wrong branch number'});
        }
        const treeId = info[0].tree_id;

        console.log('authentication.js validateLeafurl treeId', treeId);
        
        knex('trees')
        .select('tree_name', 'icon')
        .where({
            tree_id: treeId
        })
        .then(info => {
            console.log('authentication.js validateUrl response from trees', info);
            const treeName = info[0].tree_name;
            const icon = info[0].icon;

            let token = jwt.sign({
                username: userName, 
                userid: userId, 
                view: view, 
                branchId: branchId, 
                treeId: treeId,
                treeName: treeName,
                treeIcon: icon
            }, superSecretKey);
            res.status(200).json({token: token, username: userName, userid: userId, view: view, branchId: branchId, treeId: treeId, treeName: treeName, treeIcon: icon});
            return;
        })
        .catch(err => {
            res.status(404).json({message: "error getting tree name and icon"});
        })

    })
    .catch(err => {
        return res.status(401).json(err);
    })

}

exports.urlAuthentication = (req, res) => {
    console.log('authentication.js urlAuthentication', req.body.url)
    const {url} = req.body;

    if (!url) {
        return res.status(404).json({message: 'missing url'});
    }

    const location = JSON.parse(url);

    if (!location.hostname) {
        return res.status(401).json({message: 'missing location.hostname'})
    }

    const hostParts = location.hostname.split('.');

    if (hostParts.length < 2) {
        return res.status(401).json({message: 'missing userName'})
    }

    const userName = hostParts[0];

    console.log('authentication.js urlAuthentication getting ready to check users table for userName', userName);

    knex('users')
    .select('user_id')
    .where({
        user_name: userName
    })
    .then(info => {

        console.log('authentication.js urlAuthentication users table response', info);
        if (!info.length) {
            return res.status(401).json({message: 'bad userName'});
        }

        const pathname = location.pathname;

        console.log('authentication.js urlAuthentication', 'pathname', pathname);

        if (pathname.startsWith('/l/')) {
            const userId = info[0].user_id;
            return validateUrl('leafView', userId, userName, pathname, res);
        }

        if (pathname.startsWith('/b/')) {
            const userId = info[0].user_id;
            return validateUrl('branchView', userId, userName, pathname, res);
        }

        return res.status(401).json({message: 'invalid pathname'});
    })
    .catch(err => {
        return res.status(401).json(err);
    })
}