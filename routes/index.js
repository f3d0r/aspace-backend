var router = require('express').Router();

router.use('/parking', require('./api/parking'));
router.use('/admin', require('./api/admin'));
router.use('/auth', require('./api/auth'));

module.exports = router;