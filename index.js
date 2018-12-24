const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
const db = require('./data/connection.js');
const port = process.env.PORT || 3000;
const play = require('./data/games.js')();

// play.drop(n)
// play.restore()

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')

const server = app.listen(port, () => console.log(`App listening on port ${port}.`))
const io = require('socket.io')(server);

var queue = [];

io.on('connection', function(socket) {
  console.log('User connected! id: ' + socket.id);


  let methodsSet = false;
  let ids = {
    myid: socket.id,
    enemyid: null,
    id: null,
    enemy: null
  }


  socket.on('startGame', function(data) {
    console.log('Player ' + data.name.slice(8) + ' is waiting for new game');


    let sentReq = false;
    let sentRes = false;

    if (queue.length === 0) {
      queue.push({ ids: ids, name: data.name });
    } else {
      // set ids for you and opponent
      let p = queue.splice(0, 1)[0];
      console.log(p);
      ids.enemyid = p.ids.myid;
      p.ids.enemyid = ids.myid;
      p.ids.enemy = data.name;
      ids.enemy = p.name;

      // create game
      play.game([data.name, p.name]).then(function(_id) {
        ids.id = p.ids.id = _id;
        io.to(ids.enemyid).emit('startGame', { id: _id, enemyName: data.name, initiative: 0 });
        io.to(ids.myid).emit('startGame', { id: _id, enemyName: p.name, initiative: 1 });

        console.log('New game started! Players: ' + data.name.slice(8) + ' and ' + p.name.slice(8));
      })
    }

    if (!methodsSet) {
      methodsSet = true

      socket.on('chat', function(msg) {
        console.log('messaging!');
        io.to(ids.enemyid).emit('chat', msg);
      })

      socket.on('pint', function(d) {
        console.log('Says ' + d);
        console.log('Player ' + data.name.slice(8) + ' is pinging');
        console.log('IDS: ' + JSON.stringify(ids));
      })

      socket.on('requestIn', function(data) {
        console.log('requestIn event! data: ' + JSON.stringify(data));
        io.to(ids.enemyid).emit('requestOut', data);
      })

      socket.on('responseIn', function(data) {
        console.log('responseIn event! data: ' + JSON.stringify(data));
        io.to(ids.enemyid).emit('responseOut', data);
      })

      socket.on('disconnect', function() {
        console.log('user ' + ids.myid + ' disconnected');
        if (queue[0] && queue[0].name === data.name) {
          queue.splice(0, 1);
        } else
        io.to(ids.enemyid).emit('connection closed');
      })

      socket.on('refresh', function() {
        console.log('REFRESHING');
        sentReq = false;
        sentRes = false;
        play.end(ids.id);
      })
    }
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
