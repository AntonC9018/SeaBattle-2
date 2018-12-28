const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
const db = require('./data/connection.js');
const port = process.env.PORT || 3000;
const play = require('./data/games.js')();

function salt() {
  return Math.random().toString(36).substr(2, 8);
}

play.drop(db)
// play.restore()

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')

const server = app.listen(port, () => console.log(`App listening on port ${port}.`))
const io = require('socket.io')(server);

var queue = [];

io.on('connection', function(socket) {
  console.log('User connected! id: ' + socket.id);

  // game monitoring
  socket.on('games', function(data) {
    socket.join('games');

    // serve all games
    socket.on('get all games',
      () => play.list().then(
        data => io.to(socket.id).emit('get all games', data)))

    // serve a specific game
    socket.on('get game',
      id => play.getGame(id).then(
        data => io.to(socket.id).emit('get game', data)))
  })

  let ID;

  socket.on('pint', function(cmd, args) {
    if (!cmd) console.log('Queue: ' + JSON.stringify(queue));
    else if (cmd === 'drop') {
      play.drop(db);
      console.log('All games deleted');
    }
    else if (cmd === 'add') {
      args[0] = salt() + args[0];
      args[1] = salt() + args[1];
      play.game(args).then(id => console.log('Game added. Game id: ' + (ID = id)));
    }
    else if (cmd === 'log') {
      console.log('Queue: ' + JSON.stringify(queue));
      console.log('Running games: ' + JSON.stringify(play.runningGames));
      console.log('reqs: ' + JSON.stringify(play.reqs));
    }
    else if (cmd === 'end') play.end(ID).then(() => console.log(ID + ' has ended successfully'))
    else if (cmd === 'list') play.list().then(gs => console.log(gs))
    else if (cmd === 'update') play.update(ID, { i: 0, j: 0 }).then((r) => console.log('play{}: ' + r));
    else if (cmd === 'boards') {
      play.getGame(args).then(r => {
        console.log(r);
        console.log(JSON.stringify(r.boards));
      })
    }
    else if (cmd === 'test') {
      console.log(cmd);
      io.sockets.in('games').emit(args, 'test', 'test');
    }
  })

  var ingame = false;

  socket.on('chat', (msg, sender) => {
    if (ingame) return;
    if (!sender) sender = 'anon'
    socket.broadcast.emit('chat', msg, sender)
  })

  socket.on('start game', function(data) {

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
      socket.once('start', function() {
        ingame = true;
      })
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
        ingame = true;
        game.id = _id;

        // first queued player goes first
        io.to(game.ids[0]).emit('start game',
          { id: _id, enemyName: name, initiative: 0 });

        // the second queued player goes second
        io.to(game.ids[1]).emit('start game',
          { id: _id, enemyName: game.names[0], initiative: 1 });

        // notify players that monitor games that a game has started
        play.getGame(_id).then(
          game => io.sockets.in('games').emit('new game', game))

        console.log('New game started! Players: ' + name.slice(8) + ' and ' + game.names[entok].slice(8));
      })
    }

    // chat between the two players
    function chat(msg, name) {
      if (!ingame) return;
      io.to(game.ids[entok]).emit('chat', msg, name);
    }

    // bind chat
    socket.on('chat', chat);

    // accept requests
    socket.on('requestIn', function(data) {
      if (game.init === token) {

        // pass them to the other player
        io.to(game.ids[entok]).emit('requestOut', data);
        data.target = entok;

        // save changes to db
        update(game.id, data);

      } else {
        console.log('error');
      }
    })
    // accept responses
    socket.on('responseIn', function(data) {
      if (game.init === entok) {

        // pass them to the other player
        io.to(game.ids[entok]).emit('responseOut', data);

        // save changes to db
        update(game.id, data);

        if (!data.hit) {
          // pass turn
          game.init = token;
        }

      } else {
        console.log('error');
      }
    })

    socket.on('disconnect', function() {
      console.log('user ' + name + ' disconnected');

      // remove the player from queue
      if (queue[0] && queue[0].game.names[0] === name) {
        queue.splice(0, 1);

      } else // notify the other player about the disconnection
      io.to(game.ids[entok]).emit('connection closed');
    })

    socket.on('refresh', function() {
      console.log('REFRESHING');
      play.end(game.id);
      socket.removeListener('chat', chat);
      socket.removeAllListeners('pint');
      socket.removeAllListeners('requestIn');
      socket.removeAllListeners('responseIn');
      socket.removeAllListeners('disconnect');
      socket.removeAllListeners('refresh');
      game = null;
      ingame = false;
    })
  })
})


// monitoring of the running games
app.get('/games',
  (req, res) => res.sendFile(__dirname + '/public/games/games.html'))

// monitoring of a specific games
app.get('/games/:id',
  (req, res) => res.sendFile(__dirname + '/public/games/specificgame.html'))


function update(id, data) {
  play.update(id, data).then((res) => {
    if (res) {
      io.to('games').emit(id, res, data);
    }
  });
}
