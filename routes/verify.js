//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let path = require('path');

var router = express.Router();

router.get('/', (req, res) => {
  let salt = req.query['salt'];
  if (salt) {
    db.none('UPDATE Members SET verification = 1 WHERE salt = $1', [salt])
      .then(() => { // If successful, run function passed into .then()
        res.sendFile(path.join(__dirname+'/../pages/verify.html'));
      })
      // More than one row shouldn't be found, since table has constraint on it
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
