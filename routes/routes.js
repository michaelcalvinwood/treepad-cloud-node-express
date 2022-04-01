const router = require('express').Router();
const { route } = require('express/lib/application');
const knexCommands = require('../database/knex-commands');


router.route('/').get((req, res) => {
    res.status(200).send("routes ready");
});

// trees

router.route('/trees')
    .post(knexCommands.addTree);

router.route('/trees/:userId')
    .get(knexCommands.getTrees);

// branches

router.route('/branches/order/:treeId')
    .get(knexCommands.getBranches);

router.route('/branches/name/:branchId')
    .get(knexCommands.getBranchName);

router.route('/branches/order/save/:treeId')
    .post(knexCommands.saveBranchOrder);

router.route('/branches/name/save')
    .post(knexCommands.saveBranchName);

//branch pool

router.route('/branch-pool/:userId')
    .get(knexCommands.getBranchPool);

router.route('/branch-pool/:userId/:treeId/:branchId')
    .delete(knexCommands.updateBranchPool)




module.exports = router;