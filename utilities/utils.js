//Get the connection to Heroku Database
let db = require('./sql_conn.js');

//We use this to create the SHA256 hash
const crypto = require("crypto");

/**
 * Method to get a salted hash
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */

function getHash(pw, salt) {
  return crypto.createHash("sha256").update(pw + salt).digest("hex");
}

let messaging = require('./pushy_services.js');

module.exports = {
  db,
  getHash,
  messaging
};
