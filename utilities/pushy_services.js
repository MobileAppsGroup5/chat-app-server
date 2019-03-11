var Pushy = require('pushy');
// Plug in your Secret API Key
var pushyAPI = new Pushy(process.env.PUSHY_API_KEY);
//use to send message to all clients registered to a Topoic
function sendToTopic(topic, msg, from) {
  //build the message for FCM to send
  var data = {
    "type": "topic_msg",
    "sender": from,
    "message": msg,
  };
  console.log(data);
  to = '/topics/' + topic;
  // Send push notification via the Send Notifications API
  // https://pushy.me/docs/api/send-notifications
  pushyAPI.sendPushNotification(data, to, {}, function(err, id) {
    // Log errors to console
    if (err) {
      return console.log('Fatal Error', err);
    }
    // Log success
    console.log('Push sent successfully! (ID: ' + id + ')');
  });
}

//use to send message to a specific client by the token
function sendMessageToIndividual(token, msg, from, chatId) {
  //build the message for FCM to send
  var data = {
    "type": "msg",
    "sender": from,
    "message": msg,
    "chatid": chatId,
  };
  console.log(data);
  // Send push notification via the Send Notifications API
  // https://pushy.me/docs/api/send-notifications
  pushyAPI.sendPushNotification(data, token, {}, function(err, id) {
    // Log errors to console
    if (err) {
      return console.log('Fatal Error', err);
    }
    // Log success
    console.log('Push sent successfully! (ID: ' + id + ')');
  });
}

//use to send contact request to a specific client by the token
function sendContactReqToIndividual(token, from, to, msg) {
  //build the message for FCM to send
  var data = {
    "type": "conn req",
    "sender": from,
    "to": to,
    "message": msg,
  };
  console.log(data);
  // Send push notification via the Send Notifications API
  // https://pushy.me/docs/api/send-notifications
  pushyAPI.sendPushNotification(data, token, {}, function(err, id) {
    // Log errors to console
    if (err) {
      return console.log('Fatal Error', err);
    }
    // Log success
    console.log('Push sent successfully! (ID: ' + id + ')');
  });
}

//use to send contact request to a specific client by the token
function sendChatRoomReqToIndividual(token, from, to, chatName, msg) {
  //build the message for FCM to send
  var data = {
    "type": "convo req",
    "sender": from,
    "to": to,
    "chatName": chatName,
    "message": msg,
  };
  console.log(data);
  // Send push notification via the Send Notifications API
  // https://pushy.me/docs/api/send-notifications
  pushyAPI.sendPushNotification(data, token, {}, function(err, id) {
    // Log errors to console
    if (err) {
      return console.log('Fatal Error', err);
    }
    // Log success
    console.log('Push sent successfully! (ID: ' + id + ')');
  });
}

module.exports = {
  sendToTopic,
  sendMessageToIndividual,
  sendContactReqToIndividual,
  sendChatRoomReqToIndividual,
};
