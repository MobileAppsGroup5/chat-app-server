// Create connection to Heroku Database
let db = require('./utils').db;

let nodemailer = require('nodemailer');

function sendVerificationEmail(email) {
  db.one('SELECT salt FROM Members WHERE email = \'' + email + '\'')
    .then(ret => {
      salt = ret['salt'];

      let user_verify_url = process.env.VERIFY_URL + '?salt=' + salt;

      let email_body = '<h2>Chapp</h2><p>Please click the following link to \
      verify your account. If you did not register for Chapp please disregard \
      this email.</p><a href=\'' + user_verify_url + '\'>' + user_verify_url + '</a>';

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
