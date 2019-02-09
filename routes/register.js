const USERNAME_MIN_LENGTH =  6;
const USERNAME_MAX_LENGTH = 12;
const PASSWORD_MIN_LENGTH =  6;
const PASSWORD_MAX_LENGTH = 12;


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

  //test if the username is valid, if username is not valid then it is not the right length
  var usernameRightLength = testUsernameLength(username);

  //test if the password is valid
  var passwordRightLength = testPasswordLength(password);
  var passwordHasNumber = testPasswordNumber(password);
  var passwordHasUpperCase = testPasswordUpperCase(password);
  var passwordHasLowerCase = testPasswordLowerCase(password);
  var passwordHasSpecialChar = testPasswordSpecialCharacter(password);

  //Verify that the caller supplied all the parameters
  //in Javascript, empty strings or null values evaluate to false
  var passwordValid = passwordRightLength && passwordHasNumber &&
      passwordHasUpperCase && passwordHasLowerCase && passwordHasSpecialChar;

  if (first && last && username && email && password && usernameRightLength && passwordValid) {
    // Storing salted hashes to make the application more secure

    let salt = crypto.randomBytes(32).toString("hex");
    let salted_hash = getHash(password, salt);

    // Generate random code for user Verification
    let code = crypto.randomBytes(32).toString("hex");

    //Use .none(). since we wont be getting anything returned from the INSERT statement in SQL
    // Also use placeholders to avoid SQL injection i.e. ($1, $2, $3)

    let params = [first, last, username, email, salted_hash, salt, code];

    db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, SALT, CODE) VALUES ($1, $2, $3, $4, $5, $6, $7)", params)
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
      
  } else if (!usernameRightLength) {
    res.send({
      success: false,
      error: "Username must be between 6 – 12 characters"
    });

  } else if (!passwordValid) {
    //send error message if the password is not the right length
    if (!passwordRightLength) {
      res.send({
        success: false,
        error: "Password must be between 6 – 12 characters"
      });

      //send error message if the password does not have a number
    } else if (!passwordHasNumber) {
      res.send({
        success: false,
        error: "Password must have a number 0 – 9"
      });

      //send error message if the password does not have an upper case
    } else if (!passwordHasUpperCase) {
      res.send({
        success: false,
        error: "Password must have an upper case letter"
      });

      //send error message if the password does not have a lower case 
    } else if (!passwordHasLowerCase) {
      res.send({
        success: false,
        error: "Password must have a lower case letter"
      });

      //send error message if the password does not have a special char
    } else if (!passwordHasSpecialChar) {
      res.send({
        success: false,
        error: "Password must have a special character of [~!@#$%^*()_+{}[]/\\-+=\"']"
      });

    }

  } else {
    res.send({
      success: false,
      input: req.body,
      error: "Missing required user information"
    });
  }
});

/**
 * Function that will return a boolean if the username is valid
 * between 6-12 characters
 * @param {String} username 
 * @returns {boolean} if the username is valid
 */
function testUsernameLength(username) {
    var usernameValid = false;
    if (username.length >= USERNAME_MIN_LENGTH && username.length <= USERNAME_MAX_LENGTH) {
      usernameValid = true;
    }
    return usernameValid;
    
}

/**
 * Function that will return a boolean if the password is vaild
 * between 6-12 characters
 * @param {String} password 
 */
function testPasswordLength(password) {
    var passwordValid = false;
    
    if (password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH) {
        passwordValid = true;
    }
    return passwordValid;
}

/* use regex to find the exitsance of a lower case letter in the password */
function testPasswordLowerCase(password) {
    return /[a-z]/.test(password);
}

/* use regex to find the existance of a upper case letter in the password */
function testPasswordUpperCase(password) {
    return /[A-Z]/.test(password);
}

/* use regular expression to find the existance of a digit in the password */
function testPasswordNumber(password) {
    return /\d/.test(password);
}

/* use regular expression to find the existance of a special character in the password */
function testPasswordSpecialCharacter(password) {
    //~!@#$%^*()_+{}[]/\-+=\"',`
    return /[~!@#$%^*()_+{}[\]/\-+=\"',`]/.test(password);
}

module.exports = router;
