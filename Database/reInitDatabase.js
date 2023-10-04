const fs = require('fs');

const reInitDatabase = (db) => {
    try {
        fs.readFile('./Database/data.sql', 'utf8', (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                db.query(data, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(`[MESSAGE]: Database Initialized Successfully.`);
                    }
                });
            }
        });
    } catch (err) {
        console.error(err);
    }
};


module.exports = reInitDatabase;


//Procurement_Status
//0- Waiting for Invoice, 1- Waiting for PRC, 2-Received PRC, 3- Received CRAC, 4-Payment Completed 