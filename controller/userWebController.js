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
                    "message": user[0].userRole === '0' ? "Admin logged in" : "User logged in!",
                    "SECRET_TOKEN": secret_token,
                    "userEmail": user[0].userEmail,
                    "userName": user[0].userName,
                    "userRole": userRole
                });
            } else {
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
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();


            try {

                if (req.authorization_tier !== "4") {
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ, USER u_Buyer READ, USER u_Consignee READ, USER u_PAO READ`);

                    let [procurements] = await db_connection.query(` select p.procurementID, p.gemID, p.goodsType, p.goodsQuantity, 
                    p.vendorSelection, p.vendorID, v.vendorOrganization, v.vendorEmail, v.msme, v.womenOwned, v.scst, p.invoiceNo,
                    p.prcNo, p.cracNo, p.paymentId, p.procurementStatus as Status, p.procurementBuyer as Buyer_ID,
                    u_Buyer.userName as Buyer, p.procurementConsignee as Consignee_ID, u_Consignee.userName as Consignee,
                    p.procurementPAO as Payment_Authority_ID, u_PAO.userName as Payment_Authority
                    from procurement p left join vendor v on p.vendorID = v.vendorID LEFT JOIN
                    user AS u_Buyer ON p.procurementBuyer = u_Buyer.userID LEFT JOIN user AS u_Consignee 
                    ON p.procurementConsignee = u_Consignee.userID LEFT JOIN user AS u_PAO ON p.procurementPAO = u_PAO.userID;`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All Procurements fetched successfully!",
                        "procurements": procurements
                    });
                } else {
                    await db_connection.query(`LOCK TABLES Procurement READ, Vendor READ, USER u_buyer READ, USER u_Consignee READ, USER u_PAO READ`);

                    let [vendor] = await db_connection.query(`SELECT vendorID from Vendor WHERE vendorEmail = ?`, [req.body.userEmail]);
                    //console.log(id);

                    let [procurements] = await db_connection.query(` SELECT p.procurementID, p.gemID, p.goodsType, p.goodsQuantity, p.vendorSelection,
                    p.invoiceNo, u_Buyer.userEmail as Buyer, p.prcNo, p.cracNo, u_Consignee.userEmail as Consignee,
                    p.paymentID, u_PAO.userEmail as Payment_Authority, p.procurementStatus from Procurement p LEFT JOIN USER
                    AS u_Buyer ON  p.procurementBuyer = u_Buyer.userID LEFT JOIN user AS u_Consignee ON p.procurementConsignee = u_Consignee.userID
                    LEFT JOIN user AS u_PAO ON p.procurementPAO = u_PAO.userID where p.vendorID = ?;`, [vendor[0].vendor_ID]);
                    //console.log(procurements);

                    await db_connection.query(`UNLOCK TABLES`);

                    if (procurements.length === 0) {
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

    getMSME: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();


            try {


                await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                let [procurements] = await db_connection.query(` select p.goodsType, p.goodsQuantity, v.vendorOrganization
                    from procurement p left join vendor v on p.vendorID = v.vendorID
                    where v.msme='1';`);

                await db_connection.query(`UNLOCK TABLES`);

                return res.status(200).send({
                    "message": "All MSME Procurements fetched successfully!",
                    "procurements": procurements
                });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getmsme - ${err}\n`);
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
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();


            try {


                await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                let [procurements] = await db_connection.query(` select p.goodsType, p.goodsQuantity, v.vendorOrganization
                    from procurement p left join vendor v on p.vendorID = v.vendorID
                    where v.womenOwned='1';`);

                await db_connection.query(`UNLOCK TABLES`);

                return res.status(200).send({
                    "message": "All Women Owned Procurements fetched successfully!",
                    "procurements": procurements
                });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getwomen - ${err}\n`);
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
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();


            try {


                await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

                let [procurements] = await db_connection.query(` select p.goodsType, p.goodsQuantity, v.vendorOrganization
                    from procurement p left join vendor v on p.vendorID = v.vendorID 
                    where v.scst = '1';`);

                await db_connection.query(`UNLOCK TABLES`);

                return res.status(200).send({
                    "message": "All SCST Procurements fetched successfully!",
                    "procurements": procurements
                });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getscst - ${err}\n`);
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
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" || req.authorization_tier === "2" || req.authorization_tier === "3" || req.authorization_tier === "4" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            if (req.body.gemID === null || req.body.gemID === undefined || req.body.gemID === "" || isNaN(req.body.gemID) ||
                req.body.goodsType === null || req.body.goodsType === undefined || req.body.goodsType === "" ||
                req.body.goodsQuantity === null || req.body.goodsQuantity === undefined || req.body.goodsQuantity === "" ||
                req.body.vendorSelection === null || req.body.vendorSelection === undefined || req.body.vendorSelection === "" ||
                req.body.vendorID === null || req.body.vendorID === undefined || req.body.vendorID === "" || isNaN(req.body.vendorID) ||
                req.body.invoiceNo === null || req.body.invoiceNo === undefined || req.body.invoiceNo === "" || isNaN(req.body.invoiceNo)) {
                return res.status(400).send({ "message": "Missing details." });
            }

            if (req.body.vendorSelection !== "bidding" && req.body.vendorSelection !== "direct-purchase" && req.body.vendorSelection !== "reverse-auction") {
                return res.status(400).send({ "message": "Invalid Vendor selection!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES Vendor READ, Procurement WRITE, INVOICE WRITE, USER READ`);

                let [vendor] = await db_connection.query(`SELECT * from Vendor WHERE vendorID = ?`, [req.body.vendorID]);

                if (vendor.length === 0) {
                    return res.status(400).send({ "message": "Vendor not found!" });
                }

                let [procurement] = await db_connection.query(`SELECT * from Procurement WHERE gemID = ?`, [req.body.gemID]);
                let [procurement1] = await db_connection.query(`SELECT * from Procurement WHERE invoiceNo = ?`, [req.body.invoiceNo]);

                if (procurement.length > 0 || procurement1.length > 0) {
                    return res.status(400).send({ "message": "Procurement already exists!" });
                }
                await db_connection.query(`INSERT INTO INVOICE (invoiceNo,invoiceDocument) VALUES (?,?)`, [req.body.invoiceNo, "test_doc"]);
                let [buyer] = await db_connection.query(`Select userID from USER where userEmail = ?`, [req.body.userEmail]);
                buyer = buyer[0].userID;
                await db_connection.query(`INSERT into Procurement (gemID, goodsType, goodsQuantity, vendorSelection, vendorID, invoiceNo, procurementStatus, procurementBuyer) values (?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.gemID, req.body.goodsType, req.body.goodsQuantity, req.body.vendorSelection, req.body.vendorID, req.body.invoiceNo, "1", buyer]);
                await db_connection.query(`UNLOCK TABLES`);

                return res.status(400).send({ "message": "Procurement created!" });

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
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier !== '0') {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES Procurement WRITE`);

                let [procurement] = await db_connection.query(`DELETE from Procurement WHERE procurementID = ?`, [req.body.procurementID]);

                if (procurement.affectedRows === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Invalid Procurement ID!" });
                }

                return res.status(400).send({ "message": "Procurement Deleted!" });

            } catch (e) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - deleteProcurement - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ]
}
