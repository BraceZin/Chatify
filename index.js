const path = require('path')
const http = require('http')
const express = require('express');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin, getCurrentUser, userLeaves, getRoomUsers} = require('./utils/users')


const app = express();
const server = http.createServer(app)
const io = socketio(server)

//Set static folder
app.use(express.static(path.join(__dirname,'views')))
const botName = 'ChatCord Admin'
//Run when client connects 
io.on('connection', socket => {
  socket.on('joinRoom', ({username, room}) =>{
    const user = userJoin(socket.id, username, room)
    socket.join(user.room)

  //Welcome currenct user
  socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'))

  //Broadcast when user connects
  socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`))

  //Send users and room info
  io.to(user.room).emit('roomUsers', {
    room: user.room,
    users: getRoomUsers(user.room)
  })

  })


  //Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id)
    io.to(user.room).emit('message', formatMessage(user.username, msg))
  })

  
  //Runs when clients disconnects
  socket.on('disconnect', () =>{
  const user = userLeaves(socket.id)

  if(user){
    io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`))
     io.to(user.room).emit('roomUsers', {
    room: user.room,
    users: getRoomUsers(user.room)
     })
  }
  })

})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))