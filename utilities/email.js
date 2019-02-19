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

      let email_body = '<!DOCTYPE html><html><title>Verify your account! </title>\
      <head><meta name="viewport" content="width=device-width, initial-scale=1">\
      <style>p {text-align: center;}h1 {text-align: center;font-family: Verdana, Geneva, Tahoma, sans-serif;}\
      body {background-image: url("logo_transparent.png");background-repeat: no-repeat;background-size: \
      contain;background-position: center;background-color: lightblue;}\
      img {width: auto;max-width: 100%;height: auto; }</style></head>\
      <body><h1 style="font-size:16px">Welcome Chappsters!</h1><br></div></div><p>Dear Fellow Chappster,</p>\
      <p>Thanks for registering with CHAPP "The Best Chat App". \
      Attached with this email is a link that verifies your membership with CHAPP. <br>\
      <p>Please click this verification link which will automatically verify you have control over this email account.</p> \
      <p><a href=\"' + user_verify_url + '\">Verification Link for CHAPP!</a></p>\
      <br><br><p>If you did not register this account, email us immediately at\
      <a href="mailto:tcss450chapp@gmail.com">tcss450chapp@gmail.com</a>as your account might be compromised.</p><br><br>\
      </p></body></html>';

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

      transporter.sendMail(mailOptions, function (error, info) {
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
