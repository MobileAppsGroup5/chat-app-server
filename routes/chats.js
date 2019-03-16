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
              db.none(`INSERT INTO ChatMembers(chatid, MemberID, Accepted) VALUES ($1, $2, 1), ($1, $3, 0)`, [row.chatid, fromRow.memberid, toRow.memberid])
                .then(() => {
                  db.manyOrNone('select * from push_token where memberid=$1', [toRow.memberid])
                    .then((token_rows) => {
                      token_rows.forEach(element => {
                        msg_functions.sendChatRoomReqToIndividual(element['token'], usernameFrom, usernameTo, chatName,
                          'New room request from ' + usernameFrom + ' for chatroom ' + chatName);
                      })
                      res.send({
                        success: true,
                        message: 'Request successfully sent!',
                      })
                      return;
                    }).catch((err) => {
                      res.send({
                        success: false,
                        error: 'No push token ' + err,
                      });
                      return;
                    })
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
  let acceptingUsername = req.body['username'];
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
        error: 'accepting username does not exist',
      })
      return;
    })
})

router.post("/addUser", (req, res) => {
  let usernameTo = req.body['usernameTo'];
  let usernameFrom = req.body['usernameFrom']
  let chatid = req.body['chatid'];

  if (!usernameTo || !usernameFrom || !chatid) {
    res.send({
      success: false,
      error: "username or chatid was not supplied"
    });
    return;
  }

  // Get memberid
  db.one(`SELECT memberid FROM members WHERE username=$1`, [usernameTo])
    .then((toRow) => {
      db.one(`SELECT memberid FROM members WHERE username=$1`, [usernameFrom])
        .then((fromRow) => {
          db.none(`insert into chatmembers(chatid, memberid, accepted) values($2, $1, 0)`, [toRow.memberid, chatid])
            .then((requestRow) => {
              db.manyOrNone('select * from push_token where memberid=$1', [toRow.memberid])
                .then((token_rows) => {
                  db.one('select chats.name from chats where chatid=$1', [chatid])
                    .then((chatNameRow) => {
                      token_rows.forEach(element => {
                        msg_functions.sendChatRoomReqToIndividual(element['token'], usernameFrom, usernameTo, chatNameRow.chatname,
                          'New room request from ' + usernameFrom + ' for chatroom ' + chatNameRow.name);
                      })
                      res.send({
                        success: true,
                        message: 'successfully requested adding',
                        chatid: chatid,
                        username: usernameTo,
                      })
                      return;
                    }).catch((err) => {
                      res.send({
                        success: false,
                        error: 'Room does not exist ' + err,
                      });
                      return;
                    });
                }).catch((err) => {
                  res.send({
                    success: false,
                    error: 'No push token ' + err,
                  });
                  return;
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
            error: 'username does not exist',
          })
          return;
        })
    }).catch((err) => {
      res.send({
        success: false,
        error: 'username does not exist',
      })
      return;
    })
})

router.post("/leaveChat", (req, res) => {
  let username = req.body['username'];
  let chatid = req.body['chatid'];
  if (!chatid || !username) {
    res.send({
      success: false,
      error: "chatid or username not supplied"
    });
    return;
  }

  // Delete the chat members
  db.none(`delete from chatmembers using members where members.memberid=chatmembers.memberid AND chatid=$1  AND members.username=$2`, [chatid, username])
    .then(() => {
      res.send({
        success: true,
        message: 'successfully left chat',
        chatid: chatid,
      })
      return;

    }).catch((err) => {
      res.send({
        success: false,
        error: 'chat does not exist or not member!',
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

  // search up memberid
  db.one('select memberid from members where username=$1', [username])
    .then((row) => {

      // find the memberid for the given username\
      db.manyOrNone('WITH cte AS (SELECT ChatMembers.chatid\
      FROM ChatMembers INNER JOIN Members ON\
      Members.MemberID=ChatMembers.MemberID\
      WHERE Members.Username=$1)\
      SELECT Chats.name, Chats.chatid, json_agg(DISTINCT Members.Username) AS usernames, min(messages.hasbeenread) as hasbeenread, json_agg((chatmembers.accepted, members.username)) AS acceptedpairs, json_agg((messages.usernamefrom, messages.primarykey)) AS lastSenders\
      FROM Chats INNER JOIN ChatMembers ON ChatMembers.chatid=Chats.chatid INNER JOIN Members ON Members.MemberID=ChatMembers.MemberID LEFT JOIN Messages ON Messages.chatid=chats.chatid\
      WHERE EXISTS (SELECT 1 FROM cte WHERE chatid=Chats.chatid)\
      GROUP BY Chats.name, Chats.chatid\
      ', [username])
        .then((rows) => {
          // db.manyOrNone('select chatmembers.chatid, usernameFrom from members inner join chatmembers on chatmembers.memberid=members.memberid inner join messages on messages.chatid=chatmembers.chatid where messages.memberid=$1  order by messages.primarykey', row.memberid)
          // .then((innerRows) => {
          res.send({
            success: true,
            chats: rows,
          })
          // }).catch((err) => {
          //   res.send({
          //     success: false,
          //     error: 'Error in history query ' + err
          //   })
          // })

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
            error: 'Error in getchats query ' + err
          })
        })
      // }).then(() => {
      //   res.send({
      //     success: true,
      //     chats: response,
      //   })
      // })
    }).catch((err) => {
      res.sent({
        success: false,
        error: "User does not exist"
      })
    })
});
module.exports = router;
