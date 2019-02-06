//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

var router = express.Router();

const bodyParser = require("body-parser");

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//Pull in the JWT module along with our a secret key
let jwt = require('jsonwebtoken');

let config = {
  secret: process.env.JSON_WEB_TOKEN
};

router.post('/', (req, res) => {
  let email = req.body['email'];
  let theirPw = req.body['password'];
  let wasSuccessful = false;

  if (email && theirPw) {
    //Using the 'one' method means that only one row should be returned
    db.one('SELECT Password, Salt, verification FROM Members WHERE Email=$1', [email])
      .then(row => { // If successful, run function passed into .then()
        let salt = row['salt'];
        //Retrieve our copy of the password
        let ourSaltedHash = row['password'];

        //Combined their password with our salt, then hash
        let theirSaltedHash = getHash(theirPw, salt);

        //Did our salt hash match their salted hash?
        let wasCorrectPw = ourSaltedHash == theirSaltedHash;

        if (wasCorrectPw) {
          if (row['verification'] == 1) {
            // credentials match and user is verified. get a new JWT

            let token = jwt.sign({
                username: email
              },
              config.secret, {
                expiresIn: '24h' // expires in 24 hours
              }
            );
            // package and send the results
            res.json({
              success: true,
              message: 'Authentication successful!',
              token: token
            });
          } else {
            // user has not verified
            res.send({
              success: false,
              message: 'Account not verified',
            })
          }
        } else {
          // Account exists, but incorrect password
          res.send({
            success: false,
            message: 'Incorrect password',
          });
        }
      })
      //More than one row shouldn't be found, since table has constraint on it
      .catch((err) => {
        // Email must not exist in the database
        res.send({
          success: false,
          message: 'User does not exist'
        });
      });
  } else {
    res.send({
      success: false,
      message: 'Missing credentials'
    });
  }
});

module.exports = router;
