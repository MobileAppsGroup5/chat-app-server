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
      <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>\
      <img style="display:block;margin-left:auto;margin-right:auto;width:200px;height:200px;" src="https://i.imgur.com/KfRqtQp.png"/>\
      <body bgcolor="#212121" text="white"><h1 style="font-size: 16px;text-align: center;font-family: Verdana, Geneva, Tahoma, sans-serif;">Welcome Chappsters!</h1><br><p style="text-align: center;">Dear Fellow Chappster,</p>\
      <p style="text-align: center;">Thanks for registering with CHAPP "The Best Chat App". \
      Attached with this email is a link that verifies your membership with CHAPP. <br>\
      </p><p style="text-align: center;">Please click this verification link which will automatically \
      verify you have control over this email account.\
      </p> <p style="text-align: center;"><a href="' + user_verify_url + '">+' user_verify_url'</a></p><br><br>\
      <p style="text-align: center;">If you did not register this account,\
     contact us at <a href = "mailto:tcsschapp450@gmail.com">tcsschapp450@gmail.com</ahref></a> </body></html>'

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'tcsschapp450@gmail.com',
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      let mailOptions = {
        from: 'Chapp(noreply)',
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
