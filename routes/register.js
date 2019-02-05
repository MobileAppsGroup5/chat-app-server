//express is the framework we're going to use to handle requests
const express = require('express');

//We use this to create SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let sendVerificationEmail = require('../utilities/email').sendVerificationEmail;

var router = express.Router();

const bodyParser = require("body-parser");

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/', (req, res) => {
  res.type("application/json");

  //Retrieve data from query params
  var first = req.body['first'];
  var last = req.body['last'];
  var username = req.body['username'];
  var email = req.body['email'];
  var password = req.body['password'];

  //Verify that the caller supplied all the parameters
  //in Javascript, empty strings or null values evaluate to false

  if (first && last && username && email && password) {
    // Storing salted hashes to make the application more secure

    let salt = crypto.randomBytes(32).toString("hex");
    let salted_hash = getHash(password, salt);

    //Use .none(). since we wont be getting anything returned from the INSERT statement in SQL
    // Also use placeholders to avoid SQL injection i.e. ($1, $2, $3)

    let params = [first, last, username, email, salted_hash, salt];

    db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, SALT) VALUES ($1, $2, $3, $4, $5, $6)", params)
      .then(() => {
        //We successfully added the user, let the user know
        res.send({
          success: true
        });
        sendVerificationEmail(email);
      }).catch((err) => {
        //log the error
        console.log(err);
        //If we get an error, it most likely means the account already exists
        //Thus, we must let the requester know that they tried to create an account that already exists.
        res.send({
          success: false,
          error: err
        });
      });
  } else {
    res.send({
      success: false,
      input: req.body,
      error: "Missing required user information"
    });
  }
});

module.exports = router;
