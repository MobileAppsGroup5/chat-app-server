// express is the framework we're going to use to handle requests
const express = require('express');

// We use this to create the SHA256 hash
const crypto = require("crypto");

// nodemailer to send forgot passwork link to reset to user
var nodemailer =require('nodemailer');

const bodyParser = require("body-parser");

// These two const needed to encrypt the new passwords
const bcrypt = require('bcrypt');
const saltRounds = 10;

// allows us to parse the data sent in the webform.
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// Create connection to Heroku database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let sendEmail = require('../utilities/utils').sendEmail;

let path = require('path');

var router = express.Router();


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
        let token = jwt.sign({
            username:email
            
        },
        config.secret,{
            expiresIn: '1hr' // expires in 1 hour
        });
     //   let link = 'http://localhost:5000/forgot/passwordreset' + '?email=' + email + '&token=' + token;
          let user_pw_reset_url = process.env.PASSWORD_RESET_URL + '?email=' + email + '&token=' + token;

        let email_body = '<!DOCTYPE html><html><title>Let us get you back to CHAPPing it up </title>\
      <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>\
      <img style="display:block;margin-left:auto;margin-right:auto;width:200px;height:200px;" src="https://i.imgur.com/KfRqtQp.png"/>\
      <body bgcolor="#212121" text="black"><h1 style="font-size: 16px;text-align: center;font-family: Verdana, Geneva, Tahoma, sans-serif;">Let us get you logged back in!</h1><br><p style="text-align: center;">Dear Fellow Chappster,</p>\
      <p style="text-align: center;">So you forgot your password, huh? \
      No worries, we you got covered! Just click on the verification link below to reset your password. <br>\
      </p><p style="text-align: center;">This will take you to another screen in which you can input a new password. \
      But do it fast because you have t-minus 60 minutes before the link expires (security reasons) :).\
      </p> <p style="text-align: center;"><a href="' + user_pw_reset_url + '">Verification Link</a></p><br><br>\
      <p style="text-align: center;">If you did not request for a new password, please \
     contact us immediately at <a href = "mailto:tcsschapp450@gmail.com">tcsschapp450@gmail.com</ahref></a> </body></html>'

     // nodemailer takes care of sending the emails

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

router.get('/passwordreset', function (req, res) {

    let email = req.query['email'];
    let token = req.query['token'];
    
    if(email && token) {

        // save the token in the user's table, valid for 1hr.
        db.none(`UPDATE members SET resetpasswordtoken = $1 WHERE email = $2`, [token, email])
        .then(() => {
            // renders the web form for user to input password with confirmation to reset
            res.sendFile(path.join(__dirname+'/../pages/confirmpassword.html'));
        }).catch((err) => {
            res.send({
                success:false,
                message:err
            });
        });
  } else {
      res.send({
          success:false,
          message: 'The password reset token has expired or is invalid',
      })
  }
});

router.post('/resetpassword', urlencodedParser, function (req, res) {
    let email = req.body['email'];
    let newpassword = req.body['newpassword'];
    let confirmpassword = req.body['confirmpassword'];

    // still need to implement String checks for valid password template
    if (newpassword === confirmpassword) {

        // generate a salt and hash on separate function calls.
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(newpassword, salt, function(err, hash) {
                db.none(`UPDATE Members SET password = $1 WHERE email = $2`, [hash, email])
                .then(() => {
                    res.sendFile(path.join(__dirname+'/../pages/resetsuccess.html'));

                })
            });
        });

        // Compare the hash and password from DB of user.
  /*      bcrypt.compare(newpassword, hash, function(err, res) {
            //result == true
        })  */

        // Never store plaintext passwords. 
  /*      db.none(`UPDATE Members SET password = $1 WHERE email = $2`, [hash, email])
        .then(() => {
            res.sendFile(path.join(__dirname+'/../pages/resetsuccess.html'));
        
        })      */
   }
}); 




module.exports = router;
