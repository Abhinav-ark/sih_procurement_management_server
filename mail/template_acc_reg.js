const TEMPLATE_OFFICIAL_CREATED = (officialEmail, officialName, officialPassword) => {
    return `<!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Amrita Placement Tracker OTP</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
        </style>
    </head>

    <body>
        <p>Dear ${officialName},</p>
        <br />
        <p>Greetings from NEEPCO PROCUREMENT MANAGEMENT Platform. Welcome!</p>
        <p>You have been registered by the admin to the platform. Here is your credentials. Head to the login page to continue to login.</p>
        <br />
        <p>EmailID: ${officialEmail}</p>
        <p>Password: ${officialPassword}</p>
        <br />
        <p>Regards,</p>
        <p>NEEPCO PROCUREMENT MANAGEMENT</p>
    </body>

    </html>`;
}

module.exports = TEMPLATE_OFFICIAL_CREATED;