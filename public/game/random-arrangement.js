

function randomArrangement (board) {

  if (!board) board = bindConstants({})

  let sch = Object.assign({}, board.SCHEMA);
  let w = board.WIDTH;
  let h = board.HEIGHT;

  board.resetFreeCells();
  board.occupiedCells = [];
  board.ships = [];
  board.schema = sch;


  // generate a random integer in range from 0 to x - 1
  function rand(x) {
    return Math.floor(Math.random() * x);
  }


  function checkFree(obj) {
    for (let cell of board.occupiedCells) {
      if (board.compare(obj, cell)) return false;
    }
    return true;
  }


  function create(start, end) {

    // create new ship
    let ship = board.createShip(start, end);

    // check if it's valid
    // use the most effective way
    let throughFree = board.occupiedCells.length > board.freeCells.length;

    // the start and the end are already valid
    let inds = ship.inds.slice(1, -1);

    // iterate over freeCells
    if (throughFree) {
      let free = Array(inds.length).fill(false);

      for (let c of board.freeCells) {
        for (let i = 0; i < inds.length; i++) {
          if (board.compare(inds[i], c)) {
            free[i] = true;
          }
        }

        if (free.reduce((a, b) => a && b, true)) break;
      }
    }

    // iterate over occupiedCells
    else {
      for (let c of board.occupiedCells) {
        for (let i of inds) {
          if (board.compare(c, i)) {
            return console.log('not valid');
          }
        }
      }
    }

    // add the ship to 'ships' and update schema and such
    board._addShip(ship);

  }

  for (let key of Object.keys(sch)) {

    let [width, height] = key.split('.').map(e => parseInt(e));


    while (sch[key] > 0) {

      let start = board.freeCells[rand(board.freeCells.length)];

      // Now here is 2 possible ways for a new ship to be arranged
      // the first one is horizontal and the other — vertical
      // (assuming start has less value of coordinates than finish)
      // suppose the hsip is 4 by 1 (X is our random cell)
      //
      //        X[][][]
      //
      //
      //           X
      //          []
      //          []
      //          []
      //
      //
      // (There's only 1 way if the cell has dimensions 1 by 1)

      if (width === 1 && height === 1) {
        create(start, start, key);
        continue;
      }

      // Now we will check for each of those cases
      // to see if there's any available
      // first check if it would go off the screen

      let hor = !(start.x + width > w || start.y + height > h);
      let ver = !(start.x + height > w || start.y + width > h);

      if (!(hor || ver)) continue;


      // possible ends

      let horend = { x: start.x + width - 1, y: start.y + height - 1 };
      let verend = { x: start.x + height - 1, y: start.y + width - 1 };


      // now perform checks for each

      if (hor) hor = checkFree(horend)
      if (ver) ver = checkFree(verend)

      if (!(hor || ver)) continue;


      // create ships depending on the checks
      if (hor && !ver) {
        create(start, horend, key)
      }

      else if (!hor && ver) {
        create(start, verend, key)
      }

      else {
        // choose randomly between the two versions
        create(start, Math.random() > 0.5 ? horend : verend, key);
      }
    }
  }

  return board.ships;
}
