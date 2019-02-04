//Get the connection to Heroku Database
let db = require('./sql_conn.js');

//We use this to create the SHA256 hash
const crypto = require("crypto");

//To do. modularize this section @BIGMIKE. just an example.

function sendMail(from, receiver, subj, message) {

    var nodemailer = require('nodemailer');

// Burner gmail account, need to store password in .env. To do later.
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tcsschapp450@gmail.com',
        pass: 'Tcss450!'
    }
});

var mailOptions = {
    from: 'tcsschapp450@gmail.com',
    to: 'trungt@uw.edu',
    subject: 'Sending email using Node.js',
    html: '<h1>WELCOME TO CHAPP!</h1><p>That was pretty cool!</p>'
}

transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
})

}

/**
 * Method to get a salted hash
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */

 function getHash(pw, salt) {
     return crypto.createHash("sha256").update(pw + salt).digest("hex");
 }






module.exports = {
    db, getHash, sendMail
};