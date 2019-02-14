//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('../utilities/utils').db;
let getHash = require('../utilities/utils').getHash;
var router = express.Router();
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());
router.post('/token', (req, res) => {
      let email = req.body['email'];
      let token = req.body['token'];
      if (email && token) {
        db.one('SELECT MemberID FROM Members WHERE Email=$1', [email])
          //If successful, run function passed into .then()
          .then(row => {
              // Save the current FB Token
              let id = row['memberid'];
              let params = [id, token];
              db.manyOrNone('INSERT INTO Push_Token (memberId, token) VALUES ($1, $2) ON CONFLICT (memberId) DO UPDATE SET token = $2', params)
                .then(row => {
                  res.send({
                    success: true,
                    message: "Token Saved"
                  });
                })
                .catch(err => {
                  console.log("failed on insert");
                  console.log(err);
                  //If anything happened, it wasn't successful
                  res.send({
                    success: false,
                    message: err
                  });
                })
              })
            //More than one row shouldn't be found, since table has constraint on it
            .catch((err) => {
              //If anything happened, it wasn't successful
              console.log("Error on select");
              res.send({

                success: false,
                message: err
              });
            });
          }
        else {
          res.send({
            success: false,
            message: 'missing email or token'
          });
        }
      });

module.exports = router;
