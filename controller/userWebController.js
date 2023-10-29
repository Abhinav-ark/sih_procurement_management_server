const { db } = require('../connection');
var formidable = require("formidable");
const path = require('path');

const webTokenGenerator = require('../middleware/webTokenGenerator');
const webTokenValidator = require('../middleware/webTokenValidator');
const mailer = require('../mail/mailer');

const fs = require('fs');
const validator = require('validator');

const passwordGenerator = require('secure-random-password');

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

                if(user[0].userRole === '4') {
                    let [vendor] = await db_connection.query(`SELECT * from Vendor WHERE vendorEmail = ?`, [req.body.userEmail]);
                    // if(vendor.length === 0) {
                    //     return res.status(400).send({ "message": "Vendor not found!" });
                    // }
                    return res.status(200).send({
                        "message": "Vendor logged in!",
                        "SECRET_TOKEN": secret_token,
                        "userEmail": user[0].userEmail,
                        "userName": user[0].userName,
                        "userRole": userRole,
                        "vendorID": vendor[0].vendorID,
                        "vendorOrganization": vendor[0].vendorOrganization,
                        "msme": vendor[0].MSME,
                        "womenOwned": vendor[0].womenOwned,
                        "scst": vendor[0].SCST
                    });
                }

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
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ, USER u_Buyer READ, USER u_Consignee READ, USER u_PAO READ, PAYMENT READ`);

                    let [procurements] = await db_connection.query(` select p.procurementID, p.gemID, p.goodsType, p.goodsQuantity, 
                    p.vendorSelection, p.vendorID, v.vendorOrganization, v.vendorEmail, v.msme, v.womenOwned, v.scst, p.invoiceNo,
                    p.prcNo, p.cracNo, p.paymentId, PAYMENT.transactionID, PAYMENT.paymentMode, PAYMENT.paymentAmount, p.procurementStatus as Status, p.procurementBuyer as Buyer_ID,
                    u_Buyer.userName as Buyer, p.procurementConsignee as Consignee_ID, u_Consignee.userName as Consignee,
                    p.procurementPAO as Payment_Authority_ID, u_PAO.userName as Payment_Authority, p.createdAt as Created_At
                    from procurement p left join vendor v on p.vendorID = v.vendorID LEFT JOIN
                    user AS u_Buyer ON p.procurementBuyer = u_Buyer.userID LEFT JOIN user AS u_Consignee 
                    ON p.procurementConsignee = u_Consignee.userID LEFT JOIN user AS u_PAO ON p.procurementPAO = u_PAO.userID LEFT JOIN PAYMENT ON p.paymentId = PAYMENT.paymentID;`);

                    await db_connection.query(`UNLOCK TABLES`);

                    return res.status(200).send({
                        "message": "All Procurements fetched successfully!",
                        "procurements": procurements
                    });
                } else {
                    await db_connection.query(`LOCK TABLES Procurement p READ, Vendor READ, USER u_buyer READ, USER u_Consignee READ, USER u_PAO READ, PAYMENT READ`);

                    let [vendor] = await db_connection.query(`SELECT vendorID from Vendor WHERE vendorEmail = ?`, [req.body.userEmail]);
                    //console.log(id);

                    let [procurements] = await db_connection.query(` select p.procurementID, p.gemID, p.goodsType, p.goodsQuantity, 
                    p.vendorSelection, p.vendorID, p.invoiceNo,
                    p.prcNo, p.cracNo, p.paymentId, PAYMENT.transactionID, PAYMENT.paymentMode, PAYMENT.paymentAmount, p.procurementStatus as Status, p.procurementBuyer as Buyer_ID,
                    u_Buyer.userName as Buyer, p.procurementConsignee as Consignee_ID, u_Consignee.userName as Consignee,
                    p.procurementPAO as Payment_Authority_ID, u_PAO.userName as Payment_Authority, p.createdAt as Created_At
                    from procurement p 
                    LEFT JOIN user AS u_Buyer ON p.procurementBuyer = u_Buyer.userID 
                    LEFT JOIN user AS u_Consignee ON p.procurementConsignee = u_Consignee.userID 
                    LEFT JOIN user AS u_PAO ON p.procurementPAO = u_PAO.userID 
                    LEFT JOIN PAYMENT ON p.paymentId = PAYMENT.paymentID WHERE p.vendorID = ?;`, [vendor[0].vendorID]);
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

    createProcurement: [
        /*
        JSON
        {
            "gemID":<GEM_ID>,
            "goodstype":<Goods_type>,
            "goodsQuantity":<Goods_quantity>,
            "vendorSelection":<Vendor_selection>,
            "vendorID":<vendor_ID>,
            "invoiceNo":<Invoice_No>
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

            if (req.body.gemID === null || req.body.gemID === undefined || req.body.gemID === "" ||
                req.body.goodsType === null || req.body.goodsType === undefined || req.body.goodsType === "" ||
                req.body.goodsQuantity === null || req.body.goodsQuantity === undefined || req.body.goodsQuantity === "" ||
                req.body.vendorSelection === null || req.body.vendorSelection === undefined || req.body.vendorSelection === "" ||
                req.body.vendorID === null || req.body.vendorID === undefined || req.body.vendorID === "" || isNaN(req.body.vendorID) ||
                req.body.invoiceNo === null || req.body.invoiceNo === undefined || req.body.invoiceNo === "") {
                return res.status(400).send({ "message": "Missing details." });
            }

            if (req.body.vendorSelection !== "bidding" && req.body.vendorSelection !== "direct-purchase" && req.body.vendorSelection !== "reverse-auction") {
                return res.status(400).send({ "message": "Invalid Vendor selection!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES Vendor READ, Procurement WRITE, USER READ`);

                let [vendor] = await db_connection.query(`SELECT * from Vendor WHERE vendorID = ?`, [req.body.vendorID]);

                if (vendor.length === 0) {
                    return res.status(400).send({ "message": "Vendor not found!" });
                }

                let [procurement] = await db_connection.query(`SELECT * from Procurement WHERE gemID = ?`, [req.body.gemID]);
                let [procurement1] = await db_connection.query(`SELECT * from Procurement WHERE invoiceNo = ?`, [req.body.invoiceNo]);

                if (procurement.length > 0 || procurement1.length > 0) {
                    return res.status(400).send({ "message": "Procurement already exists!" });
                }
                let [buyer] = await db_connection.query(`Select userID from USER where userEmail = ?`, [req.body.userEmail]);
                buyer = buyer[0].userID;
                await db_connection.query(`INSERT into Procurement (gemID, goodsType, goodsQuantity, vendorSelection, vendorID, invoiceNo, procurementStatus, procurementBuyer) values (?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.gemID, req.body.goodsType, req.body.goodsQuantity, req.body.vendorSelection, req.body.vendorID, req.body.invoiceNo, "0", buyer]);
                await db_connection.query(`UNLOCK TABLES`);

                return res.status(200).send({ "message": "Procurement created!" });

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

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - deleteProcurement - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],

    getVendors: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" || req.authorization_tier === "2" || req.authorization_tier === "3" || req.authorization_tier === "4" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES Vendor READ`);

                let [Vendors] = await db_connection.query(`Select * from Vendor`);

                if (Vendors.length === 0) {
                    return res.status(200).send({ "message": "No Vendors found!", "Vendors": [] });
                }

                Vendors = Vendors.map((vendor) => {
                    return {
                        "vendorID": vendor.vendorID,
                        "vendorName": vendor.vendorOrganization + (vendor.msme === "1" ? " | MSME" : "") + (vendor.womenOwned === "1" ? " | Women Owned" : "") + (vendor.scst === "1" ? " | SCST" : "")
                    }
                });

                return res.status(200).send(
                    {
                        "message": "Vendors Fetched Successfully!",
                        "Vendors": Vendors
                    });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getVendors - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }

        }
    ],


    uploadPRC: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "2")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            const procurementID = req.headers.authorization.split(' ')[2];

            if (procurementID === null || procurementID === undefined || procurementID === "" || isNaN(procurementID)) {
                return res.status(400).send({ "message": "Missing details." });
            }

            let db_connection = await db.promise().getConnection();

            try {
                // check if user exists and is 0 or 2
                await db_connection.query(`LOCK TABLES USER READ`);

                let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userRole = ?`, [req.body.userEmail, req.authorization_tier]);

                if (user.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "User not found!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                // check if procurement exists

                await db_connection.query(`LOCK TABLES Procurement READ`);

                let [procurement] = await db_connection.query(`SELECT * from Procurement WHERE procurementID = ?`, [procurementID]);

                if (procurement.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Procurement not found!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                // check if procurement is in status 0
                if (procurement[0].procurementStatus !== '0' || procurement[0].prcNo !== null) {
                    return res.status(400).send({ "message": "Either PRC already exists or invalid operation!" });
                }

                var form = new formidable.IncomingForm();

                form.parse(req, async (err, fields, files) => {
                    if (err) {
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - uploadPRC - ${err}\n`);
                        await db_connection.query(`UNLOCK TABLES`);
                        return res.status(500).send({ "message": "Internal Server Error." });
                    }

                    if (files.prc === null || files.prc === undefined || files.prc === "") {
                        return res.status(400).send({ "message": "Missing PRC file!" });
                    }

                    // upload file
                    const file = files.prc[0];
                    const file_name = procurement[0].procurementID + "_PRC.pdf";
                    const file_path = path.join(__dirname, '../uploads/PRC/' + file_name);

                    fs.copyFile(file.filepath, file_path, async (err) => {
                        if (err) {
                            console.log(err);
                            const time = new Date();
                            fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - uploadPRC - ${err}\n`);
                            await db_connection.query(`UNLOCK TABLES`);
                            return res.status(500).send({ "message": "Internal Server Error." });
                        }

                        // update procurement
                        await db_connection.query(`LOCK TABLES Procurement WRITE, PRC WRITE`);
                        let [insert_id] = await db_connection.query(`INSERT INTO PRC (file_name) VALUES (?)`, [file_name]);

                        await db_connection.query(`UPDATE Procurement SET prcNo = ?, procurementStatus = ?, procurementConsignee = ? WHERE procurementID = ?`, [insert_id.insertId, '1', user[0].userID, procurementID]);

                        await db_connection.query(`UNLOCK TABLES`);

                        return res.status(200).send({ "message": "PRC uploaded successfully!" });
                    });
                });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - uploadPRC - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],


    uploadCRAC: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "2")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            const procurementID = req.headers.authorization.split(' ')[2];

            if (procurementID === null || procurementID === undefined || procurementID === "" || isNaN(procurementID)) {
                return res.status(400).send({ "message": "Missing details." });
            }

            let db_connection = await db.promise().getConnection();

            try {
                // check if user exists and is 0 or 2
                await db_connection.query(`LOCK TABLES USER READ`);

                let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userRole = ?`, [req.body.userEmail, req.authorization_tier]);

                if (user.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "User not found!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                // check if procurement exists

                await db_connection.query(`LOCK TABLES Procurement READ`);

                let [procurement] = await db_connection.query(`SELECT * from Procurement WHERE procurementID = ?`, [procurementID]);

                if (procurement.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Procurement not found!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                // check if procurement is in status 0
                if (procurement[0].procurementStatus !== '1' || procurement[0].cracNo !== null) {
                    return res.status(400).send({ "message": "Either PRC already exists or invalid operation!" });
                }

                var form = new formidable.IncomingForm();

                form.parse(req, async (err, fields, files) => {
                    if (err) {
                        console.log(err);
                        const time = new Date();
                        fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - uploadCRAC - ${err}\n`);
                        await db_connection.query(`UNLOCK TABLES`);
                        return res.status(500).send({ "message": "Internal Server Error." });
                    }

                    if (files.crac === null || files.crac === undefined || files.crac === "") {
                        return res.status(400).send({ "message": "Missing PRC file!" });
                    }

                    // upload file
                    const file = files.crac[0];
                    const file_name = procurement[0].procurementID + "_CRAC.pdf";
                    const file_path = path.join(__dirname, '../uploads/CRAC/' + file_name);

                    fs.copyFile(file.filepath, file_path, async (err) => {
                        if (err) {
                            console.log(err);
                            const time = new Date();
                            fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - uploadCRAC - ${err}\n`);
                            await db_connection.query(`UNLOCK TABLES`);
                            return res.status(500).send({ "message": "Internal Server Error." });
                        }

                        // update procurement
                        await db_connection.query(`LOCK TABLES Procurement WRITE, CRAC WRITE`);
                        let [insert_id] = await db_connection.query(`INSERT INTO CRAC (file_name) VALUES (?)`, [file_name]);

                        await db_connection.query(`UPDATE Procurement SET cracNo = ?, procurementStatus = ?, procurementConsignee = ? WHERE procurementID = ?`, [insert_id.insertId, '2', user[0].userID, procurementID]);

                        await db_connection.query(`UNLOCK TABLES`);

                        return res.status(200).send({ "message": "CRAC uploaded successfully!" });
                    });
                });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - uploadPRC - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],


    newVendor: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            if (req.body.vendorOrganization === null || req.body.vendorOrganization === undefined || req.body.vendorOrganization === "" ||
                req.body.vendorEmail === null || req.body.vendorEmail === undefined || req.body.vendorEmail === "" || !validator.isEmail(req.body.vendorEmail) ||
                req.body.msme === null || req.body.msme === undefined || req.body.msme === "" ||
                req.body.womenOwned === null || req.body.womenOwned === undefined || req.body.womenOwned === "" ||
                req.body.scst === null || req.body.scst === undefined || req.body.scst === "") {
                    console.log(req.body);
                return res.status(400).send({ "message": "Missing details." });
            }

            if (req.body.msme !== "0" && req.body.msme !== "1" ||
                req.body.womenOwned !== "0" && req.body.womenOwned !== "1" ||
                req.body.scst !== "0" && req.body.scst !== "1") {
                return res.status(400).send({ "message": "Invalid details." });
            }

            let db_connection = await db.promise().getConnection();

            try {

                // check if user exists and is 0 or 1
                await db_connection.query(`LOCK TABLES USER READ`);

                let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userRole = ?`, [req.body.userEmail, req.authorization_tier]);

                if (user.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "User not found!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                // check if vendor exists
                await db_connection.query(`LOCK TABLES Vendor READ`);

                let [vendor] = await db_connection.query(`SELECT * from Vendor WHERE vendorEmail = ?`, [req.body.vendorEmail]);

                if (vendor.length > 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Vendor already exists!" });
                }

                await db_connection.query(`LOCK TABLE USER READ`);
                let [users] = await db_connection.query(`SELECT * from USER WHERE userEmail = ?`, [req.body.vendorEmail]);

                if (users.length > 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Access restricted!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                const vendorPassword = passwordGenerator.randomPassword({
                    length: 8,
                    characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits]
                });

                // create vendor
                await db_connection.query(`LOCK TABLES Vendor WRITE, USER WRITE`);

                let [insert_id] = await db_connection.query(`INSERT INTO Vendor (vendorOrganization, vendorEmail, msme, womenOwned, scst) VALUES (?, ?, ?, ?, ?)`, [req.body.vendorOrganization, req.body.vendorEmail, req.body.msme, req.body.womenOwned, req.body.scst]);
                
                await db_connection.query(`INSERT INTO USER (userEmail,userName,userRole,userPassword) VALUES (?, ?, ?, ?)`, [req.body.vendorEmail,req.body.vendorOrganization, '4', vendorPassword]);
                
                await db_connection.query(`UNLOCK TABLES`);

                // send email

                mailer.vendorCreated(req.body.vendorOrganization, req.body.vendorEmail, vendorPassword);

                return res.status(200).send({ 
                    "message": "Vendor created!", 
                    "vendorID": insert_id.insertId, 
                    "vendorName":  req.body.vendorOrganization + (req.body.msme === "1" ? " | MSME" : "") + (req.body.womenOwned === "1" ? " | Women Owned" : "") + (req.body.scst === "1" ? " | SCST" : "")
                });
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - newVendor - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }

        }
    ],


    updatePaymentDetails: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0" && req.authorization_tier != "3")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            /*
            CREATE TABLE Payment (
                paymentID INT NOT NULL AUTO_INCREMENT,
                paymentAmount FLOAT NOT NULL,
                paymentMode VARCHAR(20) NOT NULL,
                transactionID INT NOT NULL,
                PRIMARY KEY (paymentID),
                UNIQUE (transactionID),
                CHECK (
                    paymentMode = 'Internet Banking'
                    OR paymentMode = 'NEFT'
                    OR paymentMode = 'IMPS'
                    OR paymentMode = 'RTGS'
                    OR paymentMode = 'Other'
                )
            );
            */

            if (req.body.procurementID === null || req.body.procurementID === undefined || req.body.procurementID === "" || isNaN(req.body.procurementID)) {
                return res.status(400).send({ "message": "Missing details." });
            }

            if (req.body.paymentAmount === null || req.body.paymentAmount === undefined || req.body.paymentAmount === "" || isNaN(req.body.paymentAmount) ||
                req.body.paymentMode === null || req.body.paymentMode === undefined || req.body.paymentMode === "" ||
                req.body.transactionID === null || req.body.transactionID === undefined || req.body.transactionID === "" || isNaN(req.body.transactionID)) {
                return res.status(400).send({ "message": "Missing details." });
            }

            if (req.body.paymentMode !== "Internet Banking" && req.body.paymentMode !== "NEFT" && req.body.paymentMode !== "IMPS" && req.body.paymentMode !== "RTGS" && req.body.paymentMode !== "Other") {
                return res.status(400).send({ "message": "Invalid Payment Mode!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES USER READ`);

                let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userRole = ?`, [req.body.userEmail, req.authorization_tier]);

                if (user.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Access denied!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                await db_connection.query(`LOCK TABLES Procurement READ, Payment READ`);

                let [procurement] = await db_connection.query(`SELECT * from Procurement WHERE procurementID = ?`, [req.body.procurementID]);
                let [payment] = await db_connection.query(`SELECT * from Payment WHERE transactionID = ?`, [req.body.transactionID]);

                if (procurement.length === 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Procurement not found!" });
                }

                if (procurement[0].procurementStatus !== '2') {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Invalid operation!" });
                }

                if (payment.length > 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Payment already exists!" });
                }

                await db_connection.query(`UNLOCK TABLES`);

                await db_connection.query(`LOCK TABLES Procurement WRITE, Payment WRITE`);

                let [insert_id] = await db_connection.query(`INSERT INTO Payment (paymentAmount, paymentMode, transactionID) VALUES (?, ?, ?)`, [req.body.paymentAmount, req.body.paymentMode, req.body.transactionID]);

                await db_connection.query(`UPDATE Procurement SET procurementStatus = ?, paymentID = ?, procurementPAO = ? WHERE procurementID = ?`, ['3', insert_id.insertId, user[0].userID, req.body.procurementID]);

                await db_connection.query(`UNLOCK TABLES`);

                return res.status(200).send({ "message": "Payment details updated!" });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - updatePaymentDetails - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],

    registerOfficial: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            if (req.body.officialEmail === null || req.body.officialEmail === undefined || req.body.officialEmail === "" || !validator.isEmail(req.body.officialEmail) ||
                req.body.officialName === null || req.body.officialName === undefined || req.body.officialName === "" ||
                req.body.officialRole === null || req.body.officialRole === undefined || req.body.officialRole === "") {
                return res.status(400).send({ "message": "Missing details." });
            }

            if (req.body.officialRole !== "0" && req.body.officialRole !== "1" && req.body.officialRole !== "2" && req.body.officialRole !== "3") {
                return res.status(400).send({ "message": "Invalid Role!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES USER READ`);
                let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userRole = ?`, [req.body.userEmail, req.authorization_tier]);

                if (user.length === 0 || user[0].userRole !== '0') {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Access denied!" });
                }

                let [official] = await db_connection.query(`SELECT * from USER WHERE userEmail = ?`, [req.body.officialEmail]);

                if (official.length > 0) {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Official already exists!" });
                }

                // generate a random password for the manager.
                const managerPassword = passwordGenerator.randomPassword({
                    length: 8,
                    characters: [passwordGenerator.lower, passwordGenerator.upper, passwordGenerator.digits]
                });

                // SHA256 hash the password.
                // const passwordHashed = crypto.createHash('sha256').update(managerPassword).digest('hex');

                await db_connection.query(`LOCK TABLES USER WRITE`);

                await db_connection.query(`INSERT INTO USER (userEmail, userName, userRole, userPassword) VALUES (?, ?, ?, ?)`, [req.body.officialEmail, req.body.officialName, req.body.officialRole, managerPassword]);

                await db_connection.query(`UNLOCK TABLES`);

                // send email to the manager with the password.
                mailer.officialCreated(req.body.officialName, req.body.officialEmail, managerPassword);

                return res.status(200).send({ "message": "Official registered!" });
                
            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - registerOfficial - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],

    getRegisteredOfficials: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
                (req.authorization_tier != "0")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES USER READ`);

                let [user] = await db_connection.query(`SELECT * from USER WHERE userEmail = ? AND userRole = ?`, [req.body.userEmail, req.authorization_tier]);

                if (user.length === 0 || user[0].userRole !== '0') {
                    await db_connection.query(`UNLOCK TABLES`);
                    return res.status(400).send({ "message": "Access denied!" });
                }

                let [officials] = await db_connection.query(`SELECT userID, userEmail, userName, userRole FROM USER`);

                await db_connection.query(`UNLOCK TABLES`);

                if (officials.length === 0) {
                    return res.status(200).send({ "message": "No officials found!", "officials": [] });
                }

                return res.status(200).send({ "message": "Officials fetched successfully!", "officials": officials });


            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getRegisteredOfficials - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],

    allVendors: [
        webTokenValidator,
        async (req, res) => {
            if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
                req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
                req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" || req.authorization_tier === "2" || req.authorization_tier === "3" || req.authorization_tier === "4" ||
                (req.authorization_tier != "0" && req.authorization_tier != "1")) {
                return res.status(400).send({ "message": "Access Restricted!" });
            }

            let db_connection = await db.promise().getConnection();

            try {
                await db_connection.query(`LOCK TABLES Vendor READ`);

                let [Vendors] = await db_connection.query(`Select * from Vendor`);

                if (Vendors.length === 0) {
                    return res.status(200).send({ "message": "No Vendors found!", "Vendors": [] });
                }

                return res.status(200).send(
                    {
                        "message": "Vendors Fetched Successfully!",
                        "Vendors": Vendors
                    });

            } catch (err) {
                console.log(err);
                const time = new Date();
                fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getVendors - ${err}\n`);
                return res.status(500).send({ "message": "Internal Server Error." });
            } finally {
                await db_connection.query(`UNLOCK TABLES`);
                db_connection.release();
            }
        }
    ],


    // USELESS FUNCTIONS. Can get all of this from all procurements and filter em in frontend.

    // getMSME: [
    //     webTokenValidator,
    //     async (req, res) => {
    //         if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
    //             req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
    //             req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
    //             (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
    //             return res.status(400).send({ "message": "Access Restricted!" });
    //         }

    //         let db_connection = await db.promise().getConnection();


    //         try {


    //             await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

    //             let [procurements] = await db_connection.query(` select p.goodsType, p.goodsQuantity, v.vendorOrganization
    //                 from procurement p left join vendor v on p.vendorID = v.vendorID
    //                 where v.msme='1';`);

    //             await db_connection.query(`UNLOCK TABLES`);

    //             return res.status(200).send({
    //                 "message": "All MSME Procurements fetched successfully!",
    //                 "procurements": procurements
    //             });

    //         } catch (err) {
    //             console.log(err);
    //             const time = new Date();
    //             fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getmsme - ${err}\n`);
    //             return res.status(500).send({ "message": "Internal Server Error." });
    //         } finally {
    //             await db_connection.query(`UNLOCK TABLES`);
    //             db_connection.release();
    //         }
    //     }
    // ],
    // getWomen: [
    //     webTokenValidator,
    //     async (req, res) => {
    //         if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
    //             req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
    //             req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
    //             (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
    //             return res.status(400).send({ "message": "Access Restricted!" });
    //         }

    //         let db_connection = await db.promise().getConnection();


    //         try {


    //             await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

    //             let [procurements] = await db_connection.query(` select p.goodsType, p.goodsQuantity, v.vendorOrganization
    //                 from procurement p left join vendor v on p.vendorID = v.vendorID
    //                 where v.womenOwned='1';`);

    //             await db_connection.query(`UNLOCK TABLES`);

    //             return res.status(200).send({
    //                 "message": "All Women Owned Procurements fetched successfully!",
    //                 "procurements": procurements
    //             });

    //         } catch (err) {
    //             console.log(err);
    //             const time = new Date();
    //             fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getwomen - ${err}\n`);
    //             return res.status(500).send({ "message": "Internal Server Error." });
    //         } finally {
    //             await db_connection.query(`UNLOCK TABLES`);
    //             db_connection.release();
    //         }
    //     }
    // ],

    // getSCST: [
    //     webTokenValidator,
    //     async (req, res) => {
    //         if (req.body.userEmail === null || req.body.userEmail === undefined || req.body.userEmail === "" || !validator.isEmail(req.body.userEmail) ||
    //             req.body.userRole === null || req.body.userRole === undefined || req.body.userRole === "" ||
    //             req.authorization_tier === null || req.authorization_tier === undefined || req.authorization_tier === "" ||
    //             (req.authorization_tier != "0" && req.authorization_tier != "1" && req.authorization_tier != "2" && req.authorization_tier != "3" && req.authorization_tier != "4")) {
    //             return res.status(400).send({ "message": "Access Restricted!" });
    //         }

    //         let db_connection = await db.promise().getConnection();


    //         try {


    //             await db_connection.query(`LOCK TABLES Procurement p READ, Vendor v READ`);

    //             let [procurements] = await db_connection.query(` select p.goodsType, p.goodsQuantity, v.vendorOrganization
    //                 from procurement p left join vendor v on p.vendorID = v.vendorID 
    //                 where v.scst = '1';`);

    //             await db_connection.query(`UNLOCK TABLES`);

    //             return res.status(200).send({
    //                 "message": "All SCST Procurements fetched successfully!",
    //                 "procurements": procurements
    //             });

    //         } catch (err) {
    //             console.log(err);
    //             const time = new Date();
    //             fs.appendFileSync('logs/errorLogs.txt', `${time.toISOString()} - getscst - ${err}\n`);
    //             return res.status(500).send({ "message": "Internal Server Error." });
    //         } finally {
    //             await db_connection.query(`UNLOCK TABLES`);
    //             db_connection.release();
    //         }
    //     }
    // ],
}
