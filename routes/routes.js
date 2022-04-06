const router = require('express').Router();
const { route } = require('express/lib/application');
const knexCommands = require('../database/knex-commands');
const authentication = require('./authentication');
const fileHelper = require('../fileHelper');
const knex = require('knex')(require('../knexfile').development);
const bcrypt = require("bcrypt");


// public routes
router.route('/').get((req, res) => {
    res.status(200).send("routes ready");
});

router.route('/login')
    .post(authentication.login);

router.route('/authenticate')
    .post(authentication.urlAuthentication);

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

router.route('/modules')
    .get(knexCommands.getAllModules);

router.route('/modules/:moduleName/:branchId')
    .get(knexCommands.getActiveModuleContent);

router.route('/modules/:moduleName/:branchId')
    .post(knexCommands.saveModuleContent);

router.route('/modules/:branchId')
    .get(knexCommands.getActiveModule)
    .put(knexCommands.setActiveModule)

//assets

router.route('/assets', )
    .post(knexCommands.uploadAssets);

router.route('/asset/:userId/:fileName')
    .get(fileHelper.getFile)

module.exports = router;