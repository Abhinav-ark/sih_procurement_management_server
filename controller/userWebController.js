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
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ, USER u_Buyer READ, USER u_Consignee READ, USER u_PAO READ`);

                    let [procurements] = await db_connection.query(` select p.procurement_ID, p.GeM_ID, p.goods_type, p.goods_quantity, 
                    p.vendor_selection, p.vendor_ID, v.vendor_Organization, v.vendor_Email, v.msme, v.women_owned, v.sc_st, p.Invoice_No,
                    p.PRC_No, p.CRAC_No, p.Payment_Id, p.Procurement_Status as Status, p.Procurement_Buyer as Buyer_ID,
                    u_Buyer.userName as Buyer, p.Procurement_Consignee as Consignee_ID, u_Consignee.userName as Consignee,
                    p.Procurement_PAO as Payment_Authority_ID, u_PAO.userName as Payment_Authority
                    from procurement p left join vendor v on p.vendor_ID = v.vendor_ID LEFT JOIN
                    user AS u_Buyer ON p.Procurement_Buyer = u_Buyer.userID LEFT JOIN user AS u_Consignee 
                    ON p.Procurement_Consignee = u_Consignee.userID LEFT JOIN user AS u_PAO ON p.Procurement_PAO = u_PAO.userID;`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All Procurements fetched successfully!",
                        "procurements": procurements
                    });
                }else{
                    await db_connection.query(`LOCK TABLES Procurement READ, Vendor READ, USER u_buyer READ, USER u_Consignee READ, USER u_PAO READ`);

                    let [vendor] =await db_connection.query(`SELECT vendor_ID from Vendor WHERE vendor_Email = ?`, [req.body.userEmail]);
                    //console.log(id);

                    let [procurements] = await db_connection.query(` SELECT p.Procurement_ID, p.GeM_ID, p.Goods_type, p.Goods_quantity, p.Vendor_selection,
                    p.Invoice_No, u_Buyer.userEmail as Buyer, p.PRC_No, p.CRAC_No, u_Consignee.userEmail as Consignee,
                    p.Payment_ID, u_PAO.userEmail as Payment_Authority, p.Procurement_Status from Procurement p LEFT JOIN USER
                    AS u_Buyer ON  p.Procurement_Buyer = u_Buyer.userID LEFT JOIN user AS u_Consignee ON p.Procurement_Consignee = u_Consignee.userID
                    LEFT JOIN user AS u_PAO ON p.Procurement_PAO = u_PAO.userID where p.Vendor_ID = ?;`, [vendor[0].vendor_ID]);
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
    getMSE: [
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

                
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                    let [procurements] = await db_connection.query(` select p.goods_type, p.goods_quantity, v.vendor_Organization
                    from procurement p left join vendor v on p.vendor_ID = v.vendor_ID
                    where v.mse='1';`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All MSE Procurements fetched successfully!",
                        "procurements": procurements
                    });
                
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getmse - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],
    getWomen: [
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

                
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                    let [procurements] = await db_connection.query(` select p.goods_type, p.goods_quantity, v.vendor_Organization
                    from procurement p left join vendor v on p.vendor_ID = v.vendor_ID
                    where v.women_owned='1';`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All Women_Owned Procurements fetched successfully!",
                        "procurements": procurements
                    });
                
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getmse - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],

    getSCST: [
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

                
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                    let [procurements] = await db_connection.query(` select p.goods_type, p.goods_quantity, v.vendor_Organization
                    from procurement p left join vendor v on p.vendor_ID = v.vendor_ID 
                    where v.sc_st = '1';`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All SCST Procurements fetched successfully!",
                        "procurements": procurements
                    });
                
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getmse - ${err}\n`);
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
                await db_connection.query(`LOCK TABLES Vendor READ, Procurement WRITE, INVOICE WRITE, USER READ`);

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
                let [buyer] = await db_connection.query(`Select userID from USER where userEmail = ?`,[req.body.userEmail]);
                buyer=buyer[0].userID;
                await db_connection.query(`INSERT into Procurement (GeM_ID, Goods_type, Goods_quantity, Vendor_selection, vendor_ID, Invoice_No, Procurement_status, Procurement_Buyer) values (?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.GeM_ID, req.body.Goods_type, req.body.Goods_quantity, req.body.Vendor_selection, req.body.Vendor_ID, req.body.Invoice_No, "1",buyer]);
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
    ],

    deleteProcurement: [
        /*
        JSON
        {
            "Procurement_ID":<Procurement_ID>
        }
        */
        webTokenValidator,
        async (req,res) => {
            if(req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
            req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
            req.authorization_tier !== '0'){
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();
            
            try{
                await db_connection.query(`LOCK TABLES Procurement WRITE`);

                let [procurement] = await db_connection.query(`DELETE from Procurement WHERE Procurement_ID = ?`, [req.body.Procurement_ID]);

                if (procurement.affectedRows === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Invalid Procurement_ID!" });
                }

                return res.status(400).send({ "message": "Procurement Deleted!" });

            }catch(e){
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - deleteProcurement - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            }finally{
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ]  
}
