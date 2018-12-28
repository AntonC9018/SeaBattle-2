var socket = io();
var boards;

// connect to monitoring channel
socket.emit('games');

// get the game to be monitored
socket.emit('get game', window.location.pathname.split('/').pop());
socket.on('get game', game => listen(game))

function cellClicked(x, y, p) {
  console.log('You cannot intervene with the game');
  console.log(p.cells);
}

function ping(meth, msg) {
  socket.emit('pint', meth, msg);
}

// start listening for updates of a specific game
function listen(game) {

  console.log(game);

  if (!game) {
    $('body').html('404');
    return;
  }

  function C(i, game) {
    return  {
      type: 'hidden',
      click: cellClicked,
      cells: game.boards[i]
    }
  }

  let divs = [$('#myNavy'), $('#enemyNavy')];

  divs.map((e, i) => e.find('.nick')
                      .html(game.players[i].slice(8)));

  // create a sketch for each players
  boards = divs.map((e, i) => createSketch(C(i, game), e[0]));


  socket.on(game._id, function(req, res) {

    boards[req.target].set(req.x, req.y, res.hit ? SHIP : GAP);

    // make adjacent cells into gaps on kill
    if (res.kill) {
      res.kill.adj.map(
        c => boards[req.target].set(c.x, c.y, GAP))
    }
  })
}
