var socket = io();



socket.emit('games')

socket.on('joined', id => {
  console.log(id + ' has joined');
})

if (games)
for (let game of games) {
  listen(game);
}

socket.on('newGame', game => {
  let div = document.createElement('div');
  div.id = game._id;
  div.innerHTML = `<span style="color:red">${game.players[0].slice(8)}</span> vs
  <span style="color:blue">${game.players[1].slice(8)}</span><br>
  turn: <span class="turn">0</span><br>
  the player <span style="color:yellow">${game.players[0].slice(8)}</span> has initiative<br>
  id: <span style="font-size:25px;font-style:italic">${game._id}</span><br>
  time live: <span class="time" style="display:none">${game.start}</span><br>
  <div class="boards"></div>`
  let li = document.createElement('li');
  li.append(div);
  document.querySelector('ul').append(li);
  listen(game)
})


const EMPTY = 0
GAP = 1
SHIP = 2;

const SIZE = 15,
OFFSET = SIZE / 8,
HALFSIZE = SIZE / 2,
WIDTH = 10,
HEIGHT = 10,
SM = 3

function ping(meth, msg) {
  socket.emit('pint', meth, msg);
}

function cellClicked(i, j, p) {
  console.log('You cannot intervene with the game');
  console.log(p.cells);
}

// start listening for updates of a specific game
function listen(game) {
  var el = document.getElementById(game._id);
  var div = el.querySelector('.boards');
  var turnEl = el.querySelector('.turn');
  var turn = game.turn;

  div.addEventListener('click', () => {
    window.open('./' + game._id)
  })

  var boards = [];

  for (let i = 0; i < 2; i++) {
    boards.push(new p5(sketch(false, game.boards[i]), div));
  }

  socket.on(game._id, function(request, response) {
    console.log('UPDATE: ' + JSON.stringify(request) + '\n' + JSON.stringify(response));

    if (request === 'test' && response === 'test') return;

    boards[request.target].cells[request.i][request.j] = response.hit ? SHIP : GAP;

    if (!response.hit) {
      el.innerHTML = turn++;
    }

    if (response.kill) {
      for (let cell of response.kill) {
        boards[request.target].cells[cell[0]][cell[1]] = 1;
      }
    }

    if (response.win) {
      el.style.backgroundColor = "rgb(214, 39, 39)";
      setTimeout(() => el.remove(), 2000);
    }
  })
}
