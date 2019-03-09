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
      let usernameFrom = req.body['usernameFrom'];
      let usernameTo = req.body['usernameTo'];
      let chatName = req.body['chatName'];
      if (!usernameFrom || !usernameTo || !chatName) {
        res.send({
          success: false,
          error: "one or all of username1, username2, or chatName were not supplied"
        });
        return;
      }

      // Get member ids for the given usernames
      db.one(`SELECT memberid FROM members WHERE username=$1`, [usernameFrom])
        .then((fromRow) => {
          db.one(`SELECT memberid FROM members WHERE username=$1`, [usernameTo])
            .then((toRow) => {
              // Insert chat into chats, will always create a new chat
              db.one(`INSERT INTO Chats(Name) VALUES ($1) RETURNING chatid`, [chatName])
                .then((row) => {
                  // Assign the two people to chatMembers of the chat
                  db.none(`INSERT INTO ChatMembers(ChatID, MemberID, Accepted) VALUES ($1, $2, 1), ($1, $3, 0)`, [row.chatid, fromRow.memberid, toRow.memberid])
                    .then(() => {
                      res.send({
                        success: true,
                        message: 'Request successfully sent!',
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
                    error: 'Failed to submit request ' + err,
                  });
                  return;
                });
              }).catch((err) => {
                res.send({
                  success: false,
                  error: 'To username does not exist ' + err,
                });
                return;
              });
            }).catch((err) => {
              res.send({
                success: false,
                error: 'From username does not exist ' + err,
              });
              return;
            })
          // add the chat to the chat server
        });

      router.post("/acceptRequest", (req, res) => {
        let acceptingUsername = req.body['acceptingUsername'];
        let chatid = req.body['chatid'];
        if (!acceptingUsername || !chatid) {
          res.send({
            success: false,
            error: "accepting username or chatid was not supplied"
          });
          return;
        }

        // Get memberid
        db.one(`SELECT memberid FROM members WHERE username=$1`, [acceptingUsername])
          .then((acceptingRow) => {
            db.none(`update chatmembers set accepted=1 where memberid=$1 AND chatid=$2`, [acceptingRow.memberid, chatid])
              .then((requestRow) => {
                res.send({
                  success: true,
                  message: 'successfully accepted',
                  chatid: chatid,
                  acceptingUsername: acceptingUsername,
                })
              }).catch((err) => {
                res.send({
                  success: false,
                  error: 'error while trying to update' + err,
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
      })

      // Add a user to a chat
      router.post("/addUserToChat", (req, res) => {
        let username = req.body['username'];
        let chatid = req.body['chatId'];

        if (!username || !chatid) {
          res.send({
            success: false,
            error: "username or chatid not supplied"
          });
          return;
        }

        // Get member ids for the given usernames
        db.many(`SELECT memberid FROM members WHERE username=$1`, [username])
          .then((rows) => {
            // Insert chat into chats
            db.one(`select * from chats where chatid=$1`, [chatid])
              .then((row) => {
                // Assign the two people to chatMembers of the chat
                db.none(`INSERT INTO ChatMembers(ChatID, MemberID) VALUES ($1, $2)`, [row.chatid, rows[0].memberid])
                  .then(() => {
                    res.send({
                      success: true,
                      message: 'Member successfully added!',
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
                  error: 'Chat room does not exist' + err,
                });
                return;
              });
          }).catch((err) => {
            res.send({
              success: false,
              error: 'Username does not exist ' + err,
            });
            return;
          })


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

        let response = [];
        // find the memberid for the given username\
        // new Promise(function(resolve, reject) {
        db.many('WITH cte AS (SELECT ChatMembers.ChatID\
      FROM ChatMembers INNER JOIN Members ON\
      Members.MemberID=ChatMembers.MemberID\
      WHERE Members.Username=$1)\
      SELECT Chats.name, Chats.ChatID, json_agg(DISTINCT Members.Username) AS usernames, min(messages.hasbeenread) as hasbeenread, json_agg((members.username) ORDER BY (messages.primarykey)) AS senderreceiverpairs, json_agg(chatmembers.accepted) AS acceptedpairs \
      FROM Chats INNER JOIN ChatMembers ON ChatMembers.ChatID=Chats.ChatID INNER JOIN Members ON Members.MemberID=ChatMembers.MemberID LEFT JOIN Messages ON Messages.chatid=chats.chatid\
      WHERE EXISTS (SELECT 1 FROM cte WHERE ChatID=Chats.ChatID)\
      GROUP BY Chats.name, Chats.ChatID\
      ORDER BY Chats.ChatID\
      ', [username])
          .then((rows) => {
            res.send({
              success: true,
              chats: rows,
            })

            // // new Promise((resolve, reject) => {
            //   // Get all associated chat ids
            //   db.manyOrNone(`SELECT\
            //   chatmembers.chatid\
            //   , chats.name\
            //   , members.username\
            //   FROM chatmembers\
            //   INNER JOIN chats\
            //   ON chatmembers.chatid=chats.chatid\
            //   INNER JOIN members\
            //   ON chatmembers.memberid=members.memberid\
            //   WHERE chatmembers.chatid=$1`, [chatidrows[0].chatid])
            //   .then((rows) => {
            //     res.send({
            //       success: true,
            //       chats: rows,
            //     })
            //       // new Promise((resolve, reject) => {
            //         // rows.forEach(element => {
            //         //   Object.assign(room, element);
            //         //   room.usernames.push(element.username);
            //         // });
            //         // delete room.username;
            //       //   if (room.length ==) {
            //       //     resolve();
            //       //   }
            //       // }).then(() => {
            //       //   resolve();
            //       // })
            //     }).catch((err) => {
            //       res.send({
            //         success: false,
            //         error: 'Failed to fetch chat rooms for user ' + err
            //       })
            //     });
            //   // }).then(() => {
            //   response.push(room);
            //   // if (response.length === rows.length) {
            //   //   resolve();
            //   // }
            //   // })
          }).catch((err) => {
            res.send({
              success: false,
              error: 'User does not exist ' + err
            })
          })
        // }).then(() => {
        //   res.send({
        //     success: true,
        //     chats: response,
        //   })
        // })
      });
      module.exports = router;
