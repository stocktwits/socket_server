# socket_server
Handle socket connections for realtime data

Each socket connection will subscribe to the users channel on redis. The amount of socket connections are limited
to the amount of connections redis will allow. It has to be done this way because the socket connection objects cannot
be serialized so they cannot be stored in redis. The connections also cannot be stored in a local variable because the
app has to be stateless, otherwise you will start to get funky behavior and unexpected data on the client.

Reached over 140k socket connections without redis subscriptions.
Reached 48k socket connections with each connection subscribing to redis. Once this needs to be scaled up, we can reach
more connections by adding more redis slaves.

Each app instance needs to run on its own port and load balanced to attain session affinity. Attained by JSESSIONID
cookie or by the SSL connection.