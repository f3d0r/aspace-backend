var router = require('express').Router();
const constants = require('@config');

router.use(constants.express.GLOBAL_ENDPOINT + '/admin', require('./api/admin'));
router.use(constants.express.GLOBAL_ENDPOINT + '/auth', require('./api/auth'));
router.use(constants.express.GLOBAL_ENDPOINT + '/parking', require('./api/parking'));
router.use(constants.express.GLOBAL_ENDPOINT + '/user', require('./api/user'));
router.use(constants.express.GLOBAL_ENDPOINT + '/bikes', require('./api/bikes'));
router.use(constants.express.GLOBAL_ENDPOINT + '/route_update', require('./api/routeUpdate'));
router.use(constants.express.GLOBAL_ENDPOINT + '/regions', require('./api/regions'));

module.exports = router;