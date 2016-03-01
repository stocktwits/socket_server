var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var redis   = require('redis');
var url     = require('url');
var jwt     = require('jsonwebtoken');
var nconf   = require('nconf');

var sockjs_opts = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"};
var sockjs_chat = sockjs.createServer(sockjs_opts);

// load configuration
nconf.argv().env().file({ file: './config.json' });

sockjs_chat.on('connection', function(conn) {
  var params = url.parse(conn.url, true).query;

  jwt.verify(params.token, nconf.get('jwt:private_key'), function(err, decoded) {
    if (err) {
      conn.write("Failed to authenticate token.");
      conn.close();
    }
    else{
      //var user_id = params.user_id;
      var user_id = decoded.user_id;
      if(user_id) {
        var channel_key = ["socket", user_id].join('_');
        var browser = redis.createClient(nconf.get('redis:port'), nconf.get('redis:host'));
        browser.subscribe(channel_key);

        // When we see a message on the user's channel, send it to the browser
        browser.on("message", function (channel, message) {
          if(message != 1) {  //A 1 is sent to see if the user is online
            conn.write(message);
          }
        });

        conn.on('close', function () {
          console.log("Connection closed");
          browser.quit(); //Get rid of the redis connection
        });
      }
      else{
        conn.write("Missing user id.");
        conn.close();
      }
    }
  });
});

// Express server
var app = express();
var server = http.createServer(app);

sockjs_chat.installHandlers(server, {prefix:'/chat'});
var port = process.env.NODE_PORT || 9001
server.listen(port, '0.0.0.0');
console.log(" Listening on 0.0.0.0:" + port);
console.log(" Using redis at " + nconf.get("redis:host") + ":" + nconf.get("redis:port"))
