let nodemailer = require('nodemailer');

function sendVerificationEmail(email) {

  // Burner gmail account, need to store password in .env. To do later.
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

module.exports = {
  sendVerificationEmail
};
