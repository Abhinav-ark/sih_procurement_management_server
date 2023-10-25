const express = require('express')
const router = express.Router();
const userWebController = require('../controller/userWebController');

router.get('/test', userWebController.test);

router.post('/login', userWebController.userLogin);
router.get('/getAllProcurements', userWebController.getAllProcurements);
router.get('/getMSMEProcurements',userWebController.getMSME);
router.get('/getWomenProcurements',userWebController.getWomen);
router.get('/getSCSTProcurements',userWebController.getSCST);
router.post('/createProcurement', userWebController.createProcurement);
router.post('/deleteProcurement',userWebController.deleteProcurement);

router.get('/getVendors', userWebController.getVendors);

module.exports = router;
