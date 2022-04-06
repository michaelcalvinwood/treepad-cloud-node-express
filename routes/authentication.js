const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
require('dotenv').config();

const superSecretKey=process.env.SUPERSECRETKEY;

exports.login = (req, res) => {
    const {userName, password} = req.body;
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
        if (!info.length) {
            res.status(401).json({token: null})
        }
        const passwordHash = info[0].password;
        userId = info[0].user_id;
        const verified = bcrypt.compareSync(password, passwordHash);

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
    branchId = pathname.substring(3);

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
        if (!info.length) {
            return res.status(401).json({message: 'wrong branch number'});
        }
        const treeId = info[0].tree_id;
        
        knex('trees')
        .select('tree_name', 'icon', 'branch_order')
        .where({
            tree_id: treeId
        })
        .then(info => {
            
            const treeName = info[0].tree_name;
            const icon = info[0].icon;
            const branchOrder = info[0].branch_order;

            let token = jwt.sign({
                username: userName, 
                userid: userId, 
                view: view, 
                branchId: branchId, 
                treeId: treeId,
                treeName: treeName,
                treeIcon: icon
            }, superSecretKey);
            res.status(200).json({token: token, username: userName, userid: userId, view: view, branchId: branchId, treeId: treeId, treeName: treeName, treeIcon: icon, branchOrder: branchOrder});
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

    knex('users')
    .select('user_id')
    .where({
        user_name: userName
    })
    .then(info => {

        if (!info.length) {
            return res.status(401).json({message: 'bad userName'});
        }

        const pathname = location.pathname;

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