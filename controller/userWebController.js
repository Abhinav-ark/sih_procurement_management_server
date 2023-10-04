const { db } = require('../connection')

const webTokenGenerator = require('../middleware/webTokenGenerator');
const webTokenValidator = require('../middleware/webTokenValidator');


const fs = require('fs');
const validator = require('validator');

module.exports = {
    test: async (req, res) => {
        return res.status(200).send({ "message": 'Ok' });
    },

    userLogin: async (req, res) => {
        /*
        JSON
        {
            "userEmail": "<email_id>",
            "userPassword": "<password>"
        }
        */
        if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
        req.body.userPassword === null || req.body.userPassword === undefined || req.body.userPassword === "") {
            return res.status(400).send({ "message": "Missing details." });
        }

        let db_connection = await db.promise().getConnection();

        try {
            await db_connection.query(`LOCK TABLES USER READ, Procurement READ`);

            let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userPassword = ?`, [req.body.userEmail, req.body.userPassword]);

            if (user.length > 0) {
                const secret_token = await webTokenGenerator({
                    "userEmail": req.body.userEmail,
                    "userRole": user[0].userRole,
                });

                await db_connection.query(`UNLOCK TABLES`);

                const Roles = ["Admin", "Buyer", "Consignee", "Payment Authority", "Vendor"];
                const userRole = Roles[parseInt(user[0].userRole)];

                return res.status(200).send({
                    "message": user[0].userRole==='0'?"Admin logged in":"User logged in!",
                    "SECRET_TOKEN": secret_token,
                    "userEmail": user[0].userEmail,
                    "userName": user[0].userName,
                    "userRole": userRole
                });
            }else{
                return res.status(400).send({ "message": "Invalid email or password!" });
            }
        } catch (err) {
            console.log(err);
            const time = new Date();
            fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - userLogin - ${err}\n`);
            return res.status(500).send({ "message": "Internal Server Error." });
        } finally {
            await db_connection.query(`UNLOCK TABLES`);
            db_connection.release();
        }
    },

    getAllProcurements: [
        webTokenValidator,
        async (req, res) => {
            if(req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
            req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
            req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
            (req.authorization_tier!="0" && req.authorization_tier!="1" && req.authorization_tier!="2" && req.authorization_tier!="3" && req.authorization_tier!="4")){
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();


            try {

                if(req.authorization_tier!=="4"){
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                    let [procurements] = await db_connection.query(`select p.procurement_ID, p.GeM_ID, p.goods_type, p.goods_quantity,
                    p.vendor_selection, p.vendor_ID, v.vendor_Organization,
                    v.vendor_Email, v.msme, v.women_owned, v.sc_st, p.Invoice_No,
                    p.PRC_No, p.CRAC_No, p.Payment_Id from procurement p left join vendor v on p.vendor_ID = v.vendor_ID;`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All Procurements fetched successfully!",
                        "procurements": procurements
                    });
                }else{
                    await db_connection.query(`LOCK TABLES Procurement READ, Vendor READ`);

                    let [vendor] =await db_connection.query(`SELECT vendor_ID from Vendor WHERE vendor_Email = ?`, [req.body.userEmail]);
                    //console.log(id);

                    let [procurements] = await db_connection.query(`SELECT Procurement_ID, GeM_ID, Goods_type, Goods_quantity, Vendor_selection, Invoice_No, PRC_No, CRAC_No, Payment_ID from Procurement WHERE vendor_ID = ?`, [vendor[0].vendor_ID]);
                    //console.log(procurements);

                    await db_connection.query(`UNLOCK TABLES`);

                    if(procurements.length===0){
                        return res.status(400).send({ "message": "No Procurements found!" });
                    }

                    return res.status(200).send({
                        "message": "Vendor Procurements fetched successfully!",
                        "procurements": procurements
                    });
                }
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getAllProcurements - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],

    createProcurement: [
        /*
        JSON
        {
            "GeM_ID":<GEM_ID>,
            "Goods_type":<Goods_type>,
            "Goods_quantity":<Goods_quantity>,
            "Vendor_selection":<Vendor_selection>,
            "Vendor_ID":<vendor_ID>,
            "Invoice_No":<Invoice_No>
        }
        */
        webTokenValidator,
        async (req, res) => {
            if(req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
            req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
            req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" || req.authorization_tier==="2" || req.authorization_tier==="3" || req.authorization_tier==="4" ||            
            (req.authorization_tier!="0" && req.authorization_tier!="1")){
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            if(req.body.GeM_ID === null || req.body.GeM_ID === undefined || req.body.GeM_ID === "" || isNaN(req.body.GeM_ID) ||
            req.body.Goods_type === null || req.body.Goods_type === undefined || req.body.Goods_type === "" ||
            req.body.Goods_quantity === null || req.body.Goods_quantity === undefined || req.body.Goods_quantity === "" ||
            req.body.Vendor_selection === null || req.body.Vendor_selection === undefined || req.body.Vendor_selection === "" ||
            req.body.Vendor_ID === null || req.body.Vendor_ID === undefined || req.body.Vendor_ID === "" || isNaN(req.body.Vendor_ID) ||
            req.body.Invoice_No === null || req.body.Invoice_No === undefined || req.body.Invoice_No === ""|| isNaN(req.body.Invoice_No)) {
                return res.status(400).send({ "message": "Missing details." });
            }

            if(req.body.Vendor_selection!=="bidding" && req.body.Vendor_selection!=="direct-purchase" && req.body.Vendor_selection!=="reverse-auction"){
                return res.status(400).send({ "message": "Invalid Vendor selection!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES Vendor READ, Procurement WRITE, INVOICE WRITE`);

                let [vendor] = await db_connection.query(`SELECT * from Vendor WHERE vendor_ID = ?`, [req.body.Vendor_ID]);

                if(vendor.length===0){
                    return res.status(400).send({ "message": "Vendor not found!" });
                }

                let [procurement] = await db_connection.query(`SELECT * from Procurement WHERE GeM_ID = ?`, [req.body.GeM_ID]);
                let [procurement1] = await db_connection.query(`SELECT * from Procurement WHERE Invoice_No = ?`, [req.body.Invoice_No]);

                if(procurement.length>0 || procurement1.length>0){
                    return res.status(400).send({"message": "Procurement already exists!"});
                }
                await db_connection.query(`INSERT INTO INVOICE (Invoice_No,Invoice_document) VALUES (?,?)`, [req.body.Invoice_No,1]);
                await db_connection.query(`INSERT into Procurement (GeM_ID, Goods_type, Goods_quantity, Vendor_selection, vendor_ID, Invoice_No) values (?, ?, ?, ?, ?, ?)`, [req.body.GeM_ID, req.body.Goods_type, req.body.Goods_quantity, req.body.Vendor_selection, req.body.Vendor_ID, req.body.Invoice_No]);
                await db_connection.query(`UNLOCK TABLES`);

                return res.status(400).send({"message": "Procurement created!"});

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - createProcurement - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ]

    
}