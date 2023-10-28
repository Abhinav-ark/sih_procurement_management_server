const mailer = require('nodemailer');
const fs = require('fs');
const TEMPLATE_OFFICIAL_CREATED = require('./template_acc_reg');
const TEMPLATE_VENDOR_CREATED = require('./template_vendor_acc_reg');

const transporter = mailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'noreply.neepco@gmail.com',
        pass: 'vquzimuuwchzvefz'
    }
});

module.exports = {
    officialCreated: (fullName, userEmail, password) => {
        var mailOptions = {
            from: {
                name: "NEEPCO Procurement Management",
                address: 'noreply.neepco@gmail.com'
            },
            to: userEmail,
            subject: 'Welcome to NEEPCO Procurement Management Platform',
            html: TEMPLATE_OFFICIAL_CREATED(userEmail, fullName, password)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('officialCreated Email sent: ' + userEmail);
            }
        });
    },

    vendorCreated: (vendorName, userEmail, password) => {
        var mailOptions = {
            from: {
                name: "NEEPCO Procurement Management",
                address: 'noreply.neepco@gmail.com'
            },
            to: userEmail,
            subject: 'Welcome to NEEPCO Procurement Management Platform',
            html: TEMPLATE_VENDOR_CREATED(userEmail, vendorName, password)
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('vendorCreated Email sent: ' + userEmail);
            }
        });
    },   
}