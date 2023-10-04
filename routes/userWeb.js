const express = require('express')
const router = express.Router();
const userWebController = require('../controller/userWebController');

router.get('/test', userWebController.test);

router.post('/login', userWebController.userLogin);
router.get('/getAllProcurements', userWebController.getAllProcurements);
router.post('/createProcurement', userWebController.createProcurement);
router.post('/deleteProcurement',userWebController.deleteProcurement);


module.exports = router;