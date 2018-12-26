var socket = io();

const SIZE = 35;
const OFFSET = SIZE / 8;
const HALFSIZE = SIZE / 2;
const WIDTH = 10;
const HEIGHT = 10;
const SM = 5;

socket.emit('games');

listen(game)

const EMPTY = 0
GAP = 1
SHIP = 2;

function ping(meth, msg) {
  socket.emit('pint', meth, msg);
}

function cellClicked(i, j, p) {
  console.log('You cannot intervene with the game');
  console.log(p.cells);
}

// start listening for updates of a specific game
function listen(game) {

  var boards = [];

  let first = document.getElementById('myNavy');
  let second = document.getElementById('enemyNavy');

  let fnick = first.querySelector('.nick');
  let snick = second.querySelector('.nick');

  fnick.innerHTML = game.players[0].slice(8);
  snick.innerHTML = game.players[1].slice(8);

  boards.push(new p5(sketch(false, game.boards[0]), first));
  boards.push(new p5(sketch(false, game.boards[1]), second));

  socket.on(game._id, function(request, response) {
    console.log('UPDATE: ' + JSON.stringify(request) + '\n' + JSON.stringify(response));

    if (request === 'test' && response === 'test') return;

    boards[request.target].cells[request.i][request.j] = response.hit ? SHIP : GAP;

    if (response.kill) {
      for (let cell of response.kill) {
        boards[request.target].cells[cell[0]][cell[1]] = 1;
      }
    }
  })
}
