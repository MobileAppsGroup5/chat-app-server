/**
 * This portion aims to modularize our database connection
 * @author Trung Thai
 * @version 1.0
 */

const pgp = require('pg-promise')();

//We have to set ssl usage to true for Heroku to accept our connection
pgp.pg.defaults.ssl = true;

//Create connection to Heroku Database, important to set db -> const so
// that accessing this module multiple times will NOT recreate the db connection.

const db = pgp(process.env.DATABASE_URL);

if (!db) {
  console.log("SOMETHING WENT WRONG! Please recheck the DATABASE_URL and make sure it's correct.");
  process.exit(1);
}

// Think of this as a return statement. We are returning a database object.
module.exports = db;
