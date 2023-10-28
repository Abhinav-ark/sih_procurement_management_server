const express = require('express')
const router = express.Router();
const userWebController = require('../controller/userWebController');

router.get('/test', userWebController.test);

router.post('/login', userWebController.userLogin);
router.post('/createProcurement', userWebController.createProcurement);
router.post('/deleteProcurement',userWebController.deleteProcurement);
router.post('/uploadPRC',userWebController.uploadPRC);
router.post('/uploadCRAC', userWebController.uploadCRAC);
router.post('/newVendor', userWebController.newVendor);
router.post('/updatePaymentDetails', userWebController.updatePaymentDetails);

router.get('/getAllProcurements', userWebController.getAllProcurements);
router.get('/getVendors', userWebController.getVendors);

// router.get('/getMSMEProcurements',userWebController.getMSME);
// router.get('/getWomenProcurements',userWebController.getWomen);
// router.get('/getSCSTProcurements',userWebController.getSCST);

module.exports = router;
