var router = require('express').Router();

router.use('/admin', require('./api/admin'));
router.use('/auth', require('./api/auth'));
router.use('/parking', require('./api/parking'));
router.use('/user', require('./api/user'));
router.use('/bikes', require('./api/bikes'));

module.exports = router;