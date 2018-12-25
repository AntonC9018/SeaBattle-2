var socket = io();

const EMPTY = 0
GAP = 1
SHIP = 2;

const SIZE = 15;
const OFFSET = SIZE / 8;
const HALFSIZE = SIZE / 2;
const WIDTH = 10;
const HEIGHT = 10;
const SM = 1;

for (let game of games) {

  let boards = [];

  for (let i = 0; i < 2; i++) {
    boards.push(new p5(board(false)))
  }

  socket.on(game.id, function(request, response) {
  console.log(request, response);
  game.boards[request.token][request.x][resuest.y] = response.hit ? SHIP : GAP;
    if (response.win) {

    }
  })
}
