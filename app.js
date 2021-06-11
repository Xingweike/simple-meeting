// Server
const hostname = '127.0.0.1';
const port = process.env.PORT || 4000;
const express = require('express');
const app = require('express')();
const server = require('http').createServer(app);

// socket.io
const io = require('socket.io')(server);

// Express Peer Server
const {ExpressPeerServer} = require('peer')
const peerServer = ExpressPeerServer(server , {
  proxied: true,
  debug: true,
  path: '/myapp',
  ssl: {}
});
app.use(peerServer);

// keep track of each room and their connections
let room_sizes = {};
const MAX_ROOM_SIZE = 10;

//Define the folder which contains the CSS and JS for the fontend
app.use(express.static('public'))

// Home Page
app.get('/', (req,res)=>{
  res.sendFile(__dirname + '/views/index.html');
});

// keeps requesting faviron.ico
app.get('/favicon.ico', (req,res)=>{
  console.log("caught favicon.ico");
  return;
})

// Direct User to a Room based on their Room ID
app.get('/:roomid', (req,res)=>{
  let roomid = req.params.roomid;

  // check for full room
  let numConn = (roomid in room_sizes) ? room_sizes[roomid] : 0;
  console.log("roomid: " + roomid + " currently has " + numConn + " connections!");
  if (numConn >= MAX_ROOM_SIZE) {
    res.send("Room " + roomid + " is full (Max ten people)");
  } else {
    res.sendFile(__dirname + '/views/meeting.html');
  }
  
});

// Socket io
io.on("connection", (socket) => {

  // after recieving message from client
  socket.on('joinRoom', (id, room) => {

    // Limit on certain number of people in room
    let numConn = (room in room_sizes) ? room_sizes[room] : 0;
    console.log(room + " currently has " + numConn + " participants!");

    if (numConn < MAX_ROOM_SIZE) {
      console.log("user joined room " + room + " id: " + id);
      if (!(room in room_sizes)) room_sizes[room] = 1;
      else room_sizes[room] += 1;
      
      socket.join(room);
      socket.to(room).emit('userJoined' , id, room);

      // on user disconnect, remove the user's mediastream and change room size
      socket.on('disconnect' , ()=>{
        console.log("user disconnected: " + id);
        room_sizes[room] -= 1;
        socket.to(room).emit('userDisconnect' , id);
      });

    } else {
      // full room!
      console.log("full room, doing nothing!");
    }
  });

  socket.on('endRoom', (room) => {
    // tell everyone in the room to disconnect!
    // everyone disconnecting will end the room 
    socket.to(room).emit('endRoom' , room);
  });

});

server.listen(port , ()=>{
  console.log("Server running on port : " + port);
});














