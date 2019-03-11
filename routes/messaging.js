//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('../utilities/utils').db;
var router = express.Router();
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());
let msg_functions = require('../utilities/utils').messaging;
//send a message to all users "in" the chat session with chatId
router.post("/send", (req, res) => {
  let username = req.body['username'];
  let message = req.body['message'];
  let chatId = req.body['chatId'];
  console.log(chatId);
  if (!username || !message || !chatId) {
    res.send({
      success: false,
      error: "username, message, or chatId not supplied"
    });
    return;
  }
  //add the message to the database
  let insert = `INSERT INTO Messages(ChatId, Message, MemberId, HasBeenRead, usernamefrom) VALUES ($1, $2, (SELECT MemberId FROM Members WHERE username=$3), 0, $3)`
  db.none(insert, [chatId, message, username])
    .then(() => {
      // send to members in the given chatid
      db.manyOrNone('select * from push_token inner join chatmembers on push_token.memberid=chatmembers.memberid where chatid=$1', [chatId])
        .then(rows => {
          rows.forEach(element => {
            msg_functions.sendMessageToIndividual(element['token'], message, username, chatId);
          });
          res.send({
            success: true
          });
        }).catch(err => {
          res.send({
            success: false,
            error: err,
          });
        })
    }).catch((err) => {
      res.send({
        success: false,
        error: err,
      });
    });
});


//Get all of the messages from a chat session with id chatid
router.post("/getAll", (req, res) => {
  let chatId = req.body['chatId'];
  let username = req.body['username'];
  if (!chatId || !username) {
    res.send({
      success: false,
      error: "username or chatId not supplied"
    });
    return;
  }

  let queryUpdate = 'UPDATE Messages SET HasBeenRead=1 WHERE chatId=$1 AND NOT (memberId=(SELECT memberId FROM Members WHERE username=$2))';
  let query = `SELECT Members.username, Messages.Message, to_char(Messages.Timestamp AT TIME ZONE 'PST', 'MM-DD-YY HH12:MI:SS AM' ) AS Timestamp, Messages.HasBeenRead FROM Messages INNER JOIN Members ON Messages.MemberId=Members.MemberId WHERE ChatId=$1 ORDER BY Timestamp DESC`;
  db.manyOrNone(queryUpdate, [chatId, username])
    .then(() => {
      //update read messages
      db.manyOrNone(query, [chatId])
        .then((rows) => {
          res.send({
            messages: rows,
          })
        }).catch((err) => {
          res.send({
            success: false,
            error: 'Failed to update messages as READ' + err
          })
        });
    }).catch((err) => {
      res.send({
        success: false,
        error: 'Failed error is: ' + err
      })
    });
});
module.exports = router;
