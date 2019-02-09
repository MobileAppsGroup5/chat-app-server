//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let path = require('path');

var router = express.Router();

router.get('/', (req, res) => {
  let email = req.query['email'];
  let code = req.query['code'];
  if (email && code) {
    db.none('UPDATE Members SET verification = 1 WHERE email = $1 AND code = $2', [email, code])
      .then(() => { // If successful, run function passed into .then()
        res.sendFile(path.join(__dirname+'/../pages/verify.html'));
      })
      .catch((err) => {
        //If anything happened, it wasn't successful
        res.send({
          success: false,
          message: err
        });
      });
  } else {
    res.send({
      success: false,
      message: 'Incorrect Query',
    })
  }
});



module.exports = router;
