var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var redis   = require('redis');
var url = require('url');

var sockjs_opts = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"};
var sockjs_chat = sockjs.createServer(sockjs_opts);

sockjs_chat.on('connection', function(conn) {
  var params = url.parse(conn.url, true).query;
  console.log(params.token);
  var browser = redis.createClient();
  browser.subscribe('chat_channel');

  // When we see a message on chat_channel, send it to the browser
  browser.on("message", function(channel, message){
    console.log(message);
    conn.write(message);
  });

  conn.on('close', function() {});

  // When we receive a message from browser, send it to be published
  //conn.on('data', function(message) {
    //publisher.publish('chat_channel', message);
  //});
});

// Express server
var app = express();
var server = http.createServer(app);

sockjs_chat.installHandlers(server, {prefix:'/chat'});

console.log(' Listening on 0.0.0.0:9001' );server.listen(9001, '0.0.0.0');

app.get('/', function (req, res) {
  res.send(JSON.stringify({message: "Hello from socket server."}))
});
