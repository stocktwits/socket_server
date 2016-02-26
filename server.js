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
  var user_id = params.user_id;
  var channel_key = ["socket",  user_id].join('_');
  var browser = redis.createClient(nconf.get('redis:port'), nconf.get('redis:host'));
  browser.subscribe(channel_key);

  // When we see a message on the user's channel, send it to the browser
  browser.on("message", function(channel, message){
    conn.write(message);
  });

  conn.on('close', function() {
    browser.quit();
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
