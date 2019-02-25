//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('../utilities/utils').db;
var router = express.Router();
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());
// Create a new chat
router.post("/submitRequest", (req, res) => {
  let usernameFrom = req.body['from'];
  let usernameTo = req.body['to'];
  if (!usernameFrom || !usernameTo) {
    res.send({
      success: false,
      error: "from or to usernames were not supplied"
    });
    return;
  }

  // Get memberid
  db.one(`SELECT memberid FROM members WHERE username=$1`, [usernameFrom])
    .then((fromRow) => {
      db.one(`SELECT memberid FROM members WHERE username=$1`, [usernameTo])
        .then((toRow) => {
          // Insert the req into the table
          db.none(`insert into contacts(memberid_a, memberid_b) values ($1, $2)`, [fromRow.memberid, toRow.memberid])
            .then(() => {
              res.send({
                success: true,
                message: 'Request successfully sent!'
              })
              return;
            }).catch((err) => {
              res.send({
                success: false,
                error: 'Failed create request',
              });
              return;
            })
        }).catch((err) => {
          res.send({
            success: false,
            error: 'To username does not exist',
          })
          return;
        })
    }).catch((err) => {
      res.send({
        success: false,
        error: 'From username does not exist',
      })
      return;
    })
});

router.post("/acceptRequest", (req, res) => {
  let acceptingUsername = req.body['acceptingUsername'];
  let requestUsername = req.body['requestUsername'];
  if (!acceptingUsername || !requestUsername) {
    res.send({
      success: false,
      error: "accepting or requesting usernames were not supplied"
    });
    return;
  }

  // Get memberid
  db.one(`SELECT memberid FROM members WHERE username=$1`, [acceptingUsername])
    .then((acceptingRow) => {
      db.one(`SELECT memberid FROM members WHERE username=$1`, [requestUsername])
        .then((requestRow) => {
          console.log(requestRow.memberid + ' ' + acceptingRow.memberid)
          // Insert the req into the table
          db.none(`update contacts set verified=1 where memberid_a=$1 and memberid_b=$2`, [requestRow.memberid, acceptingRow.memberid])
            .then(() => {
              res.send({
                success: true,
                message: 'successfully connected'
              })
              return;
            }).catch((err) => {
              res.send({
                success: false,
                error: 'request does not exist!',
              });
              return;
            })
        }).catch((err) => {
          res.send({
            success: false,
            error: 'request username does not exist',
          })
          return;
        })
    }).catch((err) => {
      res.send({
        success: false,
        error: 'accepting username username does not exist',
      })
      return;
    })
});

// get all contacts and requests
router.post("/getAllContactsAndRequests", (req, res) => {
  let username = req.body['username'];
  if (!username) {
    res.send({
      success: false,
      error: "username not supplied",
    });
    return;
  }

  // find the memberid for the given username
  db.one('SELECT memberid FROM members WHERE username=$1', [username])
    .then((row) => {
      // Get all associated contacts/requests
      db.manyOrNone(`SELECT M1.username as from, M2.username as to, contacts.verified FROM contacts\
      inner join members as M1 on contacts.memberid_a=M1.memberid \
      inner join members as M2 on contacts.memberid_b=M2.memberid \
      WHERE contacts.memberid_a=$1 OR contacts.memberid_b=$1`, [row.memberid])
        .then((rows) => {
          res.send({
            success: true,
            contacts: rows
          })
        }).catch((err) => {
          res.send({
            success: false,
            error: 'Failed to fetch contacts ' + err
          })
        });
    }).catch((err) => {
      res.send({
        success: false,
        error: 'User does not exist ' + err
      })
    })
});
module.exports = router;
