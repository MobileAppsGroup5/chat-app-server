//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('../utilities/utils').db;
var router = express.Router();
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());
// Create a new chat
router.post("/new", (req, res) => {
  let username1 = req.body['username1'];
  let username2 = req.body['username2'];
  let chatName = req.body['chatName'];
  if (!username1 || !username2 || !chatName) {
    res.send({
      success: false,
      error: "one or all of username1, username2, or chatName were not supplied"
    });
    return;
  }

  // Get member ids for the given usernames
  db.many(`SELECT memberid FROM members WHERE username=$1 OR username=$2`, [username1, username2])
    .then((rows) => {
      // Insert chat into chats
      db.one(`INSERT INTO Chats(Name) VALUES ($1) RETURNING chatid`, [chatName])
        .then((row) => {
          // Assign the two people to chatMembers of the chat
          db.none(`INSERT INTO ChatMembers(ChatID, MemberID) VALUES ($1, $2), ($1, $3)`, [row.chatid, rows[0].memberid, rows[1].memberid])
            .then(() => {
              res.send({
                success: true,
                message: 'Chat room successfully set up!',
              })
              return;
            }).catch((err) => {
              res.send({
                success: false,
                error: 'Failed to assign users to chatroom ' + err,
              });
              return;
            })
        }).catch((err) => {
          res.send({
            success: false,
            error: 'Failed to create new chat ' + err,
          });
          return;
        });
    }).catch((err) => {
      res.send({
        success: false,
        error: 'One or both usernames do not exist ' + err,
      });
      return;
    })
  // add the chat to the chat server

});

// get all chat rooms
router.post("/getChats", (req, res) => {
  let username = req.body['username'];
  if (!username) {
    res.send({
      success: false,
      error: "username not supplied"
    });
    return;
  }

  // find the memberid for the given username
  db.one('SELECT memberid FROM members WHERE username=$1', [username])
    .then((row) => {
      // Get all associated chat ids
      db.manyOrNone(`SELECT chatmembers.chatId, chats.name FROM chatmembers INNER JOIN chats ON chatmembers.chatid=chats.chatid WHERE memberid=$1`, [row.memberid])
        .then((rows) => {
          res.send({
            success: true,
            chats: rows
          })
        }).catch((err) => {
          res.send({
            success: false,
            error: 'Failed to fetch chat rooms for user ' + err
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
