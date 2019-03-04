//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('../utilities/utils').db;
let msg_functions = require('../utilities/utils').messaging;
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

              // send notification to push_tokens with the given memberid
              db.manyOrNone('select * from push_token inner join contacts on push_token.memberid=contacts.memberid_b where memberid=$1', [toRow.memberid])
                .then(rows => {
                  rows.forEach(element => {
                    msg_functions.sendContactReqToIndividual(element['token'], usernameFrom, usernameTo,
                          'New connection request from ' + usernameFrom);
                  });
                  res.send({
                    success: true,
                    message: 'Request successfully sent!'
                  });
                }).catch(err => {
                  res.send({
                    success: false,
                    error: "Failed to send notification" + err,
                  });
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
                message: 'successfully connected',
                acceptingUsername: acceptingUsername,
                requestUsername: requestUsername,
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

router.post("/declineCancelOrDeleteRequest", (req, res) => {
  let decliningUsername = req.body['decliningUsername'];
  let requestUsername = req.body['requestUsername'];
  if (!decliningUsername || !requestUsername) {
    res.send({
      success: false,
      error: "declining or requesting usernames were not supplied"
    });
    return;
  }

  // Get memberid
  db.one(`SELECT memberid FROM members WHERE username=$1`, [decliningUsername])
    .then((decliningRow) => {
      db.one(`SELECT memberid FROM members WHERE username=$1`, [requestUsername])
        .then((requestRow) => {
          console.log(requestRow.memberid + ' ' + decliningRow.memberid)
          // Insert the req into the table
          db.none(`delete from contacts where (memberid_a=$1 AND memberid_b=$2) OR (memberid_a=$2 AND memberid_b=$1)`, [requestRow.memberid, decliningRow.memberid])
            .then(() => {
              res.send({
                success: true,
                message: 'successfully destroyed connection',
                decliningUsername: decliningUsername,
                requestUsername: requestUsername,
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
        error: 'declining username username does not exist',
      })
      return;
    })
});

// returns firstname, lastname, username, and email from table. Useful for searching
// through contacts on the frontend
router.post("/getAllMemberData", (req, res) => {
  // find the memberid for the given username
  db.many('select firstname, lastname, username, email from members')
    .then((rows) => {
      res.send({
        success: true,
        users: rows
      })
    }).catch((err) => {
      res.send({
        success: false,
        error: 'Error fetching member data: ' + err
      })
    })
});

// get all connections and requests
router.post("/getAllConnectionsAndRequests", (req, res) => {
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
            connections: rows
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
