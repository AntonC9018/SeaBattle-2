var socket = io();
var index = 0;
var lis = [];

socket.emit('games'); // connect to server

// add ongoing games
socket.emit('get all games');
socket.on('get all games',
  data => { if (data) data.map(set) });

// add new games
socket.on('new game', set);


// create li with the game and listen for updates
function set(game) {
  add(game);
  listen(game);
}

function span(c, i) {
  return $('<span>').addClass(c).html(i);
}

function add(game) {
  lis.push(
    $('<li>')
      .append(span('name-first', game.players[0].slice(8)))
      .append(span('text', ' vs '))
      .append(span('name-second', game.players[1].slice(8)))
      .append(span('text', '<br>turn: '))
      .append(span('turn', '0'))
      .append(span('text', '<br>the player'))
      .append(span('name-playing', game.players[0].slice(8)))
      .append(span('text', ' has initiative<br>id: '))
      .append(span('id', game._id))
      .append(span('text', '<br>time live: '))
      .append(span('time', game.start))
      .append($('<br>'))
      .append($('<div>').addClass('boards'))
      .appendTo('ul'))
}



function cellClicked(x, y, p) {
  console.log('You cannot intervene with the game');
  console.log(p.cells);
}



function ping(meth, msg) {
  socket.emit('pint', meth, msg);
}

function C(i, game) {
  return {
    SIZE: 15,
    WIDTH: 10,
    HEIGHT: 10,
    CROSS_STROKE: 2,
    click: cellClicked,
    type: 'hidden',
    cells: game.boards[i]
  }
}

// start listening for updates of a specific game
function listen(game) {

  var div = lis[index].find('.boards');
  var turnEl = lis[index].find('.turn');
  var turn = game.turn;

  var i = index++;

  div.on('click', () => window.open('./' + game._id))

  // create two boards
  var boards = [];
  for (let i = 0; i < 2; i++) {
    boards.push(
      createSketch(

        // define constants for the sketch
        C(i, game),

        // append sketch to '.boards'
        div[0]));
  }

  socket.on(game._id, (req, res) => {

    // update cells
    boards[req.target].set(req.x, req.y, res.hit ? SHIP : GAP);

    // increment turn count
    if (!res.hit) {
      turnEl.html(++turn);
    }

    // make adjacent cells into gaps on kill
    if (res.kill) {
      res.kill.adj.map(
        c => boards[req.target].set(c.x, c.y, SHIP))
    }

    // win event
    if (res.win) {
      $('.' + game._id).css('backgroundColor', 'rgb(214, 39, 39)');
      setTimeout(() => el.remove(), 2000);
    }
  })
}
