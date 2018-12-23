const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
const db = require('./data/connection.js');
const port = process.env.PORT || 3000;
const play = require('./data/games.js')();

// play.drop(db)
play.restore()

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')

const server = app.listen(port, () => console.log(`App listening on port ${port}.`))
const io = require('socket.io')(server);

var queue = [];

io.on('connection', function(socket) {
  console.log('user connected! id: ' + socket.id);
  let ids = {
    myid: socket.id,
    enemyid: null,
    id: null
  }

  let sentReq = false;
  let sentRes = false;

  socket.on('startGame', function(data) {
    if (queue.length === 0) {
      queue.push({ ids: ids, name: data.name });
    } else {
      // set ids for you and opponent
      let p = queue.splice(0, 1)[0];
      ids.enemyid = p.ids.myid;
      p.ids.enemyid = ids.myid;

      // create game
      play.game([data.name, p.name]).then(function(_id) {
        ids.id = p.ids.id = _id;
        io.to(ids.enemyid).emit('startGame', { id: _id, enemyName: data.name.slice(8), initiative: 0 });
        io.to(ids.myid).emit('startGame', { id: _id, enemyName: p.name.slice(8), initiative: 1 });
      })
    }
  })

  socket.on('requestIn', function(data) {
    sentRes = false;
    sentReq = true;
    console.log('requestIn event! data: ' + JSON.stringify(data));
    io.to(ids.enemyid).emit('requestOut', data);
  })

  socket.on('responseIn', function(data) {
    sentReq = false;
    sentRes = true;
    console.log('responseIn event! data: ' + JSON.stringify(data));
    io.to(ids.enemyid).emit('responseOut', data);
  })

  socket.on('disconnect', function() {
    console.log('user ' + ids.myid + ' disconnected');
    io.to(ids.enemyid).emit('disconnect');
  })

  socket.on('refresh', function(lose) {
    console.log('REFRESHING');
    // if (lose) io.to(ids.enemyid).emit('disconnect');
    sentReq = false;
    sentRes = false;
    ids = {
      myid: socket.id,
      enemyid: null,
      id: null
    }
    play.end(ids.id);
  })


})

// list the games running
app.get('/games', function(req, res) {
  play.list().then((data) => {
    res.render('games.ejs', {
      games: data
    });
  })
})


//188.244.22.148
