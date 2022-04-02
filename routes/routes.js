const router = require('express').Router();
const { route } = require('express/lib/application');
const knexCommands = require('../database/knex-commands');
const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

//IMPORTANT: Change to .env
const superSecretKey='testKeyChangeLater';


// public routes
router.route('/').get((req, res) => {
    res.status(200).send("routes ready");
});

router.route('/login').post((req, res) => {
    const {userName, password} = req.body;
    console.log(`routes.js route /login`, userName, password);
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
        console.log('route.js route /login', info);
        if (!info.length) {
            res.status(401).json({token: null})
        }
        const passwordHash = info[0].password;
        userId = info[0].user_id;
        console.log('route.js route /login', 'userId', userId, 'passwordHash', passwordHash)
        const verified = bcrypt.compareSync(password, passwordHash);
        console.log('routes.js route /login verified', verified);

        if (verified) {
            let token = jwt.sign({username: userName, userid: userId}, superSecretKey);
            res.status(200).json({token: token, userId: userId});
            return;
        }

        res.status(401).json({token: null})
    })
});
// private routes

// trees

router.route('/trees')
    .post(knexCommands.addTree);

router.route('/trees/:userId')
    .get(knexCommands.getTrees);

// branches

router.route('/branches/order/:treeId')
    .get(knexCommands.getBranches);

router.route('/branches/order/save/:treeId')
    .post(knexCommands.saveBranchOrder);

router.route('/branches/name/:branchId')
    .get(knexCommands.getBranchName);

router.route('/branches/name/save')
    .post(knexCommands.saveBranchName);

//branch pool

router.route('/branch-pool/:userId')
    .get(knexCommands.getBranchPool);

router.route('/branch-pool/:userId/:treeId/:branchId')
    .delete(knexCommands.updateBranchPool)

//modules

router.route('/modules/:moduleName/:branchId')
    .get(knexCommands.getActiveModuleContent);

router.route('/modules/:moduleName/:branchId')
    .post(knexCommands.saveModuleContent);

router.route('/modules/:branchId')
    .get(knexCommands.getActiveModule);


module.exports = router;