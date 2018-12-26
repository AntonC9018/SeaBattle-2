
var sketch = function(myboard, cells) { // myboard indicates if it is your board or your opponent's

  return function(p) {
    p.setup = function() {
      p.offSet = [0, 0]; // offset of the grid off left and top

      p.drawGrid = function() {
        p.translate(p.offSet[0], p.offSet[1]);
        p.background(255);
        p.noFill();
        p.stroke(0);
        p.strokeWeight(1);

        // draw grid
        for (let j = 0; j < HEIGHT + 1; j++) {
          p.line(0, j * SIZE, SIZE * WIDTH, j * SIZE);
        }
        for (let i = 0; i < WIDTH + 1; i++) {
          p.line(i * SIZE, 0, i * SIZE, SIZE * HEIGHT);
        }
      }

      p.calcAdjacent = function(ship) {

        let result = [];

        let shift = function(obj, i, j) {
          return([obj.x + i || 0, obj.y + j || 0]);
        }

        // shish = shift + push
        let shish = function(obj, i, j) {
          result.push(shift(obj, i, j));
        }

        let shiftAll = function(objs, i, j) {
          for (let obj of objs) {
            shish(obj, i, j);
          }
        }

        // get outer shape cells of the ship
        let os = ship.outshape();

        // check if an index would be off the screen
        let x0 = ship.start[0] > 0;
        let xw = ship.finish[0] < WIDTH;
        let y0 = ship.start[1] > 0;
        let yh = ship.finish[1] < HEIGHT;

        // left and right adjacent cells
        if (x0) {
          shiftAll(os.lefts, -1, 0);
        }
        if (y0) {
          shiftAll(os.tops, 0, -1);
        }
        if (yh) {
          shiftAll(os.bots, 0, 1);
        }
        if (xw) {
          shiftAll(os.rights, 1, 0);
        }

        // diagonal adjacent cells
        if (x0 && y0) {
          shish(os.corns[0], -1, -1); // left top corner
        }
        if (xw && y0) {
          shish(os.corns[1], 1, -1); // right top corner
        }
        if (x0 && yh) {
          shish(os.corns[2], -1,  1); // left bottom corner
        }
        if (xw && yh) {
          shish(os.corns[3], 1,  1); // right bottom corner
        }

      return result;
    }

      // bind different functions and variables depending on the board type
      // (your or your opponent's)

      if (myboard) {

        p.ships = [];

        p.deadShips = [];

        // holds 1-2 arrays that indicate the 'start' and 'finish'
        // coordinates of the future (currently being born) ship
        p.shipCreation = [];

        p.gaps = []; // shot empty spaces

        // hint the form of the future ship while making it
        p.shipSilhouette = null;
        p.silhouette = false;

        p.occupiedCells = [];

        p.criteria = Object.assign({}, CRITERIA);


        // draw your navy and the gaps
        p.navy = function() {
          // draw ships
          for (let ship of p.ships) {
            ship.show(p);
          }
          for (let ship of p.deadShips) {
            ship.show(p);
          }
          if (p.shipSilhouette) {
            p.shipSilhouette.show(p);
          }
          p.fill(12, 103, 136);
          p.noStroke();

          // change color of shot tiles
          for (let g of p.gaps) {
            p.rect(g[0] * SIZE + 1, g[1] * SIZE + 1, SIZE - 1, SIZE - 1)
          }
        }

        // draw ship's silhouette that hints the player the size of the ships
        // while it is being created
        p.drawSilhouette = function(x, y) {
          if (p.silhouette) {
            let ends = p.matchEnds([ p.shipCreation[0], [x, y] ]);

            if (!p.shipSilhouette ||

            ( p.shipSilhouette.start[0]  !== ends.start[0]  ||
              p.shipSilhouette.start[1]  !== ends.start[1]  ||
              p.shipSilhouette.finish[0] !== ends.finish[0] ||
              p.shipSilhouette.finish[1] !== ends.finish[1]   ))

            {
              p.shipSilhouette = new Ship(ends.start, ends.finish, true);
              p.meetCriteria();
            }
          }
          p.noStroke();
        }

        p.updateCriteria = function(ship) {
          if (CRITERIA === 'any') {
            return;
          }

          if (p.criteria[ship.key] === undefined) {
            throw 'Such ship configuration is not permitted';
          }

          p.criteria[ship.key] --;

          if (p.criteria[ship.key] < 0) {
            throw 'Error. Too many ' + ship.key + ' ships.';
          }
        }

        p.meetCriteria = function() {

          if (debugging) return p.shipSilhouette.meetsCriteria = true;

          if (CRITERIA !== 'any') {

            // Check the dimensions of the ship
            let key = p.shipSilhouette.key;
            if (!(p.criteria[key] && p.criteria[key] > 0)) {
              return p.shipSilhouette.meetsCriteria = false;
            }
          }

          // Check availability of spaces
          for (let cell of p.occupiedCells) {
            for (let i of p.shipSilhouette.inds) {
              if (i.x === cell.x && i.y === cell.y) {
                return p.shipSilhouette.meetsCriteria = false;
              }
            }
          }

          p.shipSilhouette.meetsCriteria = true;
        }

        // resolve mouse click event
        p.handleClick = function(I, J) {
          if (!ingame) {
            if (p.shipCreation.length === 0) {
              if (!p.isEmpty(I, J)) return;
              p.shipCreation.push([I, J]);
              p.silhouette = true;
            } else
            // select ends of the future ship
            if (p.shipCreation.length === 1 && p.shipSilhouette.meetsCriteria) {

              // remove the silhouette
              p.shipCreation.push([I, J]);
              p.silhouette = false;
              p.shipSilhouette = null;

              // create the actual ship
              let ends = p.matchEnds(p.shipCreation);
              let newborn = new Ship(ends.start, ends.finish);
              p.ships.push(newborn);
              p.shipCreation = [];


              // Update occupiedCells

              for (let i of newborn.inds) {
                p.occupiedCells.push({ x: i.x, y: i.y });
              }

              let adj = p.calcAdjacent(newborn);
              for (let i of adj) {
                p.occupiedCells.push({ x: i[0], y: i[1] });
              }


              newborn.adj = adj;
              newborn.span = newborn.inds.length + adj.length;

              // update criteria
              p.updateCriteria(newborn);
            }
          }
          else if (debugging) {
            p.shoot(I, J);
          }
      }

        // finds out if the space is empty
        p.isEmpty = function(x, y, silh) {
          if (x > WIDTH || y > HEIGHT || x < 0 || y < 0) return;
          // check for ships
          for (let ship of p.ships) {
            if (x >= ship.start[0] && x <= ship.finish[0] &&
              y >= ship.start[1] && y <= ship.finish[1]) {
              return false;
            }
          }
          for (let ship of p.deadShips) {
            if (x >= ship.start[0] && x <= ship.finish[0] &&
              y >= ship.start[1] && y <= ship.finish[1]) {
              return false;
            }
          }
          if (silh && p.shipSilhouette &&
            x >= p.shipSilhouette.start[0] && x <= p.shipSilhouette.finish[0] &&
            y >= p.shipSilhouette.start[1] && y <= p.shipSilhouette.finish[1]) {
            return false;
          }
          // sheck for gaps
          for (let gap of p.gaps) {
            if (x === gap[0] && y === gap[1]) {
              return false;
            }
          }
          return true;
        }


        p.matchEnds = function(sc) {
            let start = [];
            let finish = [];

            { // ensure the start has the least coordinates and
              // the finish has the greatest ones

              // check X coordinates (indeces)
              if (sc[0][0] > sc[1][0]) {
                start[0] = sc[1][0];
                finish[0] = sc[0][0];
              } else {
                start[0] = sc[0][0];
                finish[0] = sc[1][0];
              }

              // check Y coordinates (indeces)
              if (sc[0][1] > sc[1][1]) {
                start[1] = sc[1][1];
                finish[1] = sc[0][1];
              } else {
                start[1] = sc[0][1];
                finish[1] = sc[1][1];
              }
            }
            return {
              start,
              finish
            }
          }


        p.shoot = function(x, y) {

          let result = null;

          // check if hit a ship
          for (let i = 0; i < p.ships.length; i++) {

            let eff = p.ships[i].shoot(x, y);

            if (eff.hit) {

              if (eff.kill !== null) {
                let deadShip = p.ships.splice(i, 1)[0];
                p.deadShips.push(deadShip);
                p.end(deadShip);

                if (p.ships.length === 0) {
                  eff.win = true;
                }
              }

              result = eff;
              break;
            }
          }

          if (result) return result;

          let notHitYet = true;

          // check if hit a gap
          for (let g of p.gaps) {
            if (g[0] === x && g[1] === y) {
              notHitYet = false; // it did
            }
          }

          // make the gap
          if (notHitYet) {
            p.gaps.push([x, y]);
            return {
              hit: false,
              kill: null,
              win: false
            };
          }

          return 'error';
        }

        p.has = function(arr, el) {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] === el[0] && arr[i][1] === el[1]){
              return i;
            }
          }
          return -1;
        }

        p.end = function(ship) {
          let cells = p.calcAdjacent(ship);

          for (let cell of cells) {
            if (p.has(p.gaps, cell) === -1)
              p.gaps.push(cell);
          }
        }

      } else {

        if (!cells) {
          let chunk = function(arr, i) {
            let res = []
            for (let j = 0; j < arr.length; j += i) {
              res.push(arr.slice(j, j + i));
            }
            return res;
          }

          let cells = new Array(WIDTH * HEIGHT).fill(0);
          p.cells = chunk(chunk(cells, HEIGHT), WIDTH)[0];
        } else {
          p.cells = cells;
        }

        // draw crosses and gaps
        p.navy = function() {
          for (let i = 0; i < WIDTH; i++) {
            for (let j = 0; j < HEIGHT; j++) {

              switch (p.cells[i][j]) {
                case EMPTY:
                  break;

                case GAP:
                  p.fill(12, 103, 136);
                  p.noStroke();
                  p.rect(i * SIZE + 1, j * SIZE + 1, SIZE - 1, SIZE - 1);
                  break;

                case SHIP:
                  p.stroke(184, 23, 23);
                  p.strokeWeight(3);
                  let x = i * SIZE + 1;
                  let y = j * SIZE + 1;
                  p.line(x + SM, y + SM,
                    x + SIZE - SM, y + SIZE - SM);
                  p.line(x + SIZE - SM, y + SM,
                    x + SM, y + SIZE - SM);
                  break;
              }
            }
          }
        }

        // do nothing
        p.drawSilhouette = function() {}

        // resolve mouse click event
        p.handleClick = function(I, J) {
          cellClicked(I, J, p);
        }

        // finds out if the space is empty
        p.isEmpty = function(x, y) {
          if (x > WIDTH || y > HEIGHT || x < 0 || y < 0) return;

          return p.cells[x][y] === 0;
        }

        p.kill = function(cells) {
          for (let c of cells) {
            p.cells[c[0]][c[1]] = GAP;
          }
        }

      }

      p.createCanvas(WIDTH * SIZE + 1 + p.offSet[0], HEIGHT * SIZE + 1 + p.offSet[1]);
    },



    // this function draws everything to the canvas ~60 times a second
    p.draw = function() {

      p.drawGrid();

      // draw the navy / enemy's navy (if hit)
      // and the gaps
      p.navy()

      // check if inside canvas
      if (p.mouseX >= p.offSet[0] && p.mouseY >= p.offSet[1] &&
        p.mouseX < p.width && p.mouseY < p.height) {
        // get row and column
        let x = ~~((p.mouseX - p.offSet[0]) / SIZE);
        let y = ~~((p.mouseY - p.offSet[1]) / SIZE);

        if (x >= WIDTH) return;
        if (y >= HEIGHT) return;

        // create half-transparent ship silhouette (while making a ship)
        p.drawSilhouette(x, y);

        p.noStroke();

        // Hovering
        if (p.isEmpty(x, y, true)) {
          p.fill(240, 238, 24);
          p.rect(x * SIZE + 1, y * SIZE + 1,
            SIZE - 1, SIZE - 1);
        } else {
          p.fill(240, 238, 24, 90);
          p.rect(x * SIZE + 1, y * SIZE + 1,
            SIZE - 1, SIZE - 1);
        }
      }
    },


    p.mouseClicked = function() {
        // check if inside canvas
        if (p.mouseX < p.offSet[0] || p.mouseY < p.offSet[1] ||
          p.mouseX >= p.width || p.mouseY >= p.height) return;

        // get row and column
        let I = ~~((p.mouseX - p.offSet[0]) / SIZE);
        if (I >= WIDTH) return;

        let J = ~~((p.mouseY - p.offSet[1]) / SIZE);
        if (J >= HEIGHT) return;

        p.handleClick(I, J);
      }

  }
}
