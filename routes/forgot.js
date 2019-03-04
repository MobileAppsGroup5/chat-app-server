// express is the framework we're going to use to handle requests
const express = require('express');

// We use this to create the SHA256 hash
const crypto = require("crypto");

// nodemailer to send forgot passwork link to reset to user
var nodemailer =require('nodemailer');

// Create connection to Heroku database
let db = require('../utilities/utils').db;

var router = express.Router();

const bodyParser = require("body-parser");

// Pull in the JWT module along with our secret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

// This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/email', (req, res) => {
    let email = req.body['email'];


        // attach the plugin to the nodemailer transport
    if(email) 
    {
        res.send({
            success:true,
            message: email
        });
        // Let's get a new token and have it expire in 1 hour
        let token = jwt.sign({
            username:email
            
        },
        config.secret,{
            expiresIn: '1hr' // expires in 1 hour
        });

        let user_pw_reset_url = process.env.PASSWORD_RESET_URL + '?email=' + email + '&token=' + token;

        console.log(user_pw_reset_url);
        console.log(token);

        let email_body = '<!DOCTYPE html><html><title>Let us get you back to CHAPPing it up </title>\
      <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>\
      <img style="display:block;margin-left:auto;margin-right:auto;width:200px;height:200px;" src="https://i.imgur.com/KfRqtQp.png"/>\
      <body bgcolor="#212121" text="black"><h1 style="font-size: 16px;text-align: center;font-family: Verdana, Geneva, Tahoma, sans-serif;">Let us get you logged back in!</h1><br><p style="text-align: center;">Dear Fellow Chappster,</p>\
      <p style="text-align: center;">So you forgot your password, huh? \
      No worries, we you got covered! Just click on the verification link below to reset your password. <br>\
      </p><p style="text-align: center;">This will take you to another screen in which you can input a new password. \
      But do it fast because you have t-minus 1 hour before the link expires (security reasons) :)\
      </p> <p style="text-align: center;"><a href="' + user_pw_reset_url + '">Verification Link</a></p><br><br>\
      <p style="text-align: center;">If you did not request for a new password, please \
     contact us immediately at <a href = "mailto:tcsschapp450@gmail.com">tcsschapp450@gmail.com</ahref></a> </body></html>'

        

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'tcsschapp450@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        let mailOptions = {
            from: 'tcsschapp450@gmail.com',
            to: email,
            subject: 'Forgot your password?',
            html: email_body,
        }

        transporter.sendMail(mailOptions, function(error, info) {
            if(error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            
        }
    });
    }
});

module.exports = router;
