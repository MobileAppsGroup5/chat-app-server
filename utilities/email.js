// Create connection to Heroku Database
let db = require('./utils').db;

let nodemailer = require('nodemailer');

let path = require('path');

function sendVerificationEmail(email) {
  db.one('SELECT code FROM Members WHERE email = \'' + email + '\'')
    .then(ret => {
      code = ret['code'];

      let user_verify_url = process.env.VERIFY_URL + '?email=' + email + '&code=' + code;

      // let email_body = '\
      // <h2>Chapp</h2>\
      // <p>Please click the following link to verify your account. If you did not\
      // register for Chapp please disregard this email.</p>\
      // <a href=\'' + user_verify_url + '\'>' + user_verify_url + '</a>';

      let email_body = '<link href=\'http://fonts.googleapis.com/css?family=Lobster+Two\' rel=\'stylesheet\' type=\'text/css\'> <html> <title>Verify your account! </title> <head> <meta name="viewport" content="width=device-width, initial-scale=1"> <style> body { background-color:lightblue; margin: 0; font-family: Arial, Helvetica, sans-serif; } h2 { font-family: Impact, \'Arial Narrow Bold\', sans-serif; } footer { text-align: center; } p { text-align: center; font-family: Verdana, Arial, Helvetica, sans-serif; } .hero-image { /*background: url(logo_transparent.png) no-repeat center; background-size: cover; */ height: 800px; margin: auto; width: 50%; } /* For width smaller than 400px; */ body { background-repeat: no-repeat; background-image: url(\'logo_transparent.png\'); } h1 { font: 400 100px/1.3 \'Lobster Two\', Helvetica, sans-serif; color: #2b2b2b; text-shadow: 1px 1px 0px #ededed, 4px 4px 0px rgba(0,0,0,0.15); border-block-end-style: dotted; } .hero-text { text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: 1A477E; } </style> </head> <body> <div class="hero-image"><br> <div class="hero-text"> <h1 style="font-size:100px">Welcome Chappsters!</h1><br><br><br><br><br><br><br><br> </div> </div> <p>Dear Fellow Chappster,</p> <p>Thank you for registering with CHAPP "The Best Chat App"&trade;. Attached with this email is a link that verifies your membership with CHAPP. <br> <p>Please click this verification link which will automatically verify you have control over this email account.</p> <p><a href=\"' + user_verify_url + '\">Verification Link for CHAPP!</a>\'</p><br><br> <p>If you did not register this account, email us immediately at <a href="mailto:tcss450chapp@gmail.com">tcss450chapp@gmail.com</a> as your account might currently be compromised.</p><br><br><br><br> </p> <footer>&copy Copyright 2019 CHAPP.inc All Rights Reserved.</footer> </body> </html>';

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'tcsschapp450@gmail.com',
          pass: process.env.EMAIL_PASSWORD,
        }
      });

      let mailOptions = {
        from: 'tcsschapp450@gmail.com',
        to: email,
        subject: 'Verify your account with Chapp',
        html: email_body,
      }

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      })
    }).catch((err) => {
      console.log(err);
    });
}

module.exports = {
  sendVerificationEmail
};
