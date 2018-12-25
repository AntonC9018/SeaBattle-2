const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
const db = require('./data/connection.js');
const port = process.env.PORT || 3000;
const play = require('./data/games.js')();

// play.drop(n)
play.restore()

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')

const server = app.listen(port, () => console.log(`App listening on port ${port}.`))
const io = require('socket.io')(server);

var queue = [];

io.on('connection', function(socket) {
  console.log('User connected! id: ' + socket.id);

  socket.on('games', function(data) {
    socket.join('games');

    // io.to(socket.id).emit('load', play.runningGames);
  })

  socket.on('pint', function() {
    console.log('Queue: ' + JSON.stringify(queue));
  })

  socket.on('startGame', function(data) {

    class G {
      constructor(id, name) {
        this.ids = [id, null];
        this.names = [name, null];
        this.id = null;
        this.enemy = null;
        this.init = 0;
      }
    }

    let game;
    let token;
    let entok;

    let name = data.name;

    console.log('Player ' + name.slice(8) + ' is waiting for new game');

    if (queue.length === 0) {
      game = new G(socket.id, name);
      token = 0;
      entok = 1;
      queue.push({ game });
    } else {
      // set game for you and opponent
      let e = queue.splice(0, 1)[0];

      game = e.game;
      token = 1;
      entok = 0;
      game.ids[1] = socket.id;
      game.names[1] = name;

      // create game
      play.game([data.name, e.game.names[0]]).then(function(_id) {
        game.id = _id;
        io.to(game.ids[0]).emit('startGame', { id: _id, enemyName: name, initiative: 0 });
        io.to(game.ids[1]).emit('startGame', { id: _id, enemyName: game.names[0], initiative: 1 });

        console.log('New game started! Players: ' + name.slice(8) + ' and ' + game.names[entok].slice(8));
      })
    }

    socket.on('chat', function(msg) {
      console.log('messaging!');
      io.to(game.ids[entok]).emit('chat', msg);
    })

    socket.on('pint', function(d) {
      console.log('Says ' + d);
      console.log('Player ' + name + ' is pinging');
      console.log('game: ' + JSON.stringify(game));
      console.log('Initiative: ' + game !== null);
    })

    socket.on('requestIn', function(data) {
      if (game.init === token) {
        io.to(game.ids[entok]).emit('requestOut', data);
        data.token = entok;
        update(game.id, data)
      } else {
        console.log('error');
      }
    })

    socket.on('responseIn', function(data) {
      if (game.init === entok) {
        io.to(game.ids[entok]).emit('responseOut', data);
        update(game.id, data);
        if (!data.hit) {
          game.init = token;
        }
      } else {
        console.log('error');
      }
    })

    socket.on('disconnect', function() {
      console.log('user ' + name + ' disconnected');
      if (queue[0] && queue[0].game.names[0] === name) {
        queue.splice(0, 1);
      } else
      io.to(game.ids[entok]).emit('connection closed');
    })

    socket.on('refresh', function() {
      console.log('REFRESHING');
      play.end(game.id);
      socket.removeAllListeners('chat');
      socket.removeAllListeners('pint');
      socket.removeAllListeners('requestIn');
      socket.removeAllListeners('responseIn');
      socket.removeAllListeners('disconnect');
      socket.removeAllListeners('refresh');
      game = null;
    })
  })
})


// list the games running
app.get('/games', function(req, res) {
  play.list().then((data) => {

      console.log(data);
    res.render('games.ejs', {
      games: data
    });
  })
})


function update(id, data) {
  play.update(game.id, data).then((err, res) => {
    if (res) {
      io.to('games').emit('update', res, data);
    }
  });
}
