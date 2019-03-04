// express is the framework we're going to use to handle requests
const express = require('express');

// We use this to create the SHA256 hash
const crypto = require("crypto");

// nodemailer to send forgot passwork link to reset to user
var nodemailer =require('nodemailer');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');

let path = require('path');



// Create connection to Heroku database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let sendEmail = require('../utilities/utils').sendEmail;

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
    if(email) {
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
            html: '<h1>Below is the link to have your password reset.</h1><br><p>Click Here</p>'
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

router.post('/forgot-password', function(req, res) {
    let user = req.body['email'];
        // attach the plugin to the nodemailer transport
    if(user) {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'tcsschapp450@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        let mailOptions = {
            from: 'tcsschapp450@gmail.com',
            to: user,
            subject: 'Forgot your password?',
            html: '<h1>Below is the link to have your password reset.</h1><br><p>Click Here</p>'
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
