const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bcrypt = require('bcrypt');
var mysql = require('mysql2');
const port = process.env.PORT || 3000;
const { v4: uuidV4 } = require('uuid');


app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = { }
const users = { };
const userData = [];

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "jboard"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  // con.query("CREATE DATABASE jboard", function (err, result) {
  //   if (err) throw err;
  //   console.log("Database created");
  // });
  // var sql = "CREATE TABLE users (name VARCHAR(255), password VARCHAR(255) , email VARCHAR(255))";
  // con.query(sql, function (err, result) {
  //   if (err) throw err;
  //   console.log("Table created");
  // });
});

app.get('/', (req, res) => {
  res.render('Login', { rooms: rooms })
})

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
  // Send message that new room was created
  io.emit('room-created', req.body.room)
})

app.get('/signup', async(req, res) => {
  res.render('Signup');
})

app.post('/signup', async(req, res) => {
  // console.log(req.body.Password);
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = { name: req.body.username, password: hashedPassword , email : req.body.emailID}
    var sql = `INSERT INTO users (name, password, email) VALUES ("${user.name}", "${user.password}", "${user.email}")`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Data added into the table!");
    });
    userData.push(user)
    console.log(userData);
    res.redirect("/");
    // res.status(201).send()
  } catch {
    res.status(500).send()
  }
})

app.post('/login', async (req, res) => {
  var user = null;
  con.query(`SELECT * FROM users where email = "${req.body.EmailID}"`, async function (err, result, fields) {
    if (err) throw err;
    console.log(result.length)
    if(result.length > 0){
      user = result[0];
      try {
        if(await bcrypt.compare(req.body.Password, user.password)) {
          if (rooms[req.body.room] != null) {
            rooms[req.body.room] = { users }
          }
          else
            rooms[req.body.room] = { users: {} }
          res.redirect(req.body.room)
          // Send message that new room was created
          io.emit('room-created', req.body.room)
        } else {
          res.send('Not Allowed')
        }
      } catch {
        res.status(500).send()
      }
    }
    else{
      return res.status(400).send('Cannot find user')
    }
  });
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room })
})



function onConnection(socket){
  socket.on('drawing', (room,data) => socket.to(room).broadcast.emit('drawing', data));
}




io.on('connection',socket => {
  // socket.on('room-id',(room) => {
  //   socket.join(room)
  // });
  socket.on('drawing',(room,data) => {
    socket.join(room);
    socket.to(room).broadcast.emit('drawing',data);
  });
  socket.on('new-user-joined',(room,name) => {
      socket.join(room)
      rooms[room].users[socket.id] = name;
      socket.to(room).broadcast.emit('user-joined',name);
  });

  socket.on('send', (room,message) => {
      socket.to(room).broadcast.emit('receive' , {message : message , name : rooms[room].users[socket.id]})
  });

  socket.on('disconnect', () => {
      getUserRooms(socket).forEach(room => {
        socket.to(room).broadcast.emit('left', rooms[room].users[socket.id])
        delete rooms[room].users[socket.id]
        if(Object.keys(rooms[room].users).length == 0){
          delete rooms[room];
        }
      })
  });
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}



http.listen(port, () => console.log('listening on port ' + port));





