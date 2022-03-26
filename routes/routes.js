const router = require('express').Router();

router.route('/').get((req, res) => {
    res.status(200).send("routes ready");
});

module.exports = router;