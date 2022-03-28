const router = require('express').Router();
const knexCommands = require('../database/knex-commands');


router.route('/').get((req, res) => {
    res.status(200).send("routes ready");
});

router.route('/trees')
    .post(knexCommands.addTree);

router.route('/trees/:userId')
    .get(knexCommands.getTrees);

router.route('/branches/order/:treeId')
    .get(knexCommands.getBranches);

module.exports = router;