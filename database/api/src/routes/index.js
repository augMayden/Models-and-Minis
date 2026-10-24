const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/listings', require('./listings'));
router.use('/cart', require('./cart'));
router.use('/orders', require('./orders'));
router.use('/admin', require('./admin'));

module.exports = router;