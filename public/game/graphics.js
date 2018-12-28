

// instantiate sketch
var createSketch = function(C, appendTo) {
  return new p5(sketch(C), appendTo);
}


// Constants + Logic + Sketch
var sketch = function(C) { // myboard indicates if it is your board or your opponent's

  var SIZE,
  STROKE,
  SM,
  OFFSET,
  HALFSIZE,
  CROSS_STROKE,
  SIZE_INVERSE,
  FRAMERATE;


  return function(p) {
    p.setup = function() {

      bindLogic(p, C);

      p.setConsts = function(C) {
        SIZE = C.SIZE || C.size || 35;
        STROKE = C.STROKE || C.stroke || 1;
        SM = C.SM || C.sm || SIZE / 8;
        OFFSET = C.OFFSET || C.offset || SIZE * 0.125;
        HALFSIZE = SIZE / 2;
        CROSS_STROKE = C.CROSS_STROKE || C.cross_stroke || SIZE * 0.1;
        SIZE_INVERSE = 1 / SIZE;
        FRAMERATE = C.FRAMERATE || C.framerate || 60;
      }

      p.setConsts(C);

      p.drawGrid = function() {
        p.background(255);
        p.noFill();
        p.stroke(0);
        p.strokeWeight(STROKE);

        // draw grid
        for (let j = 0; j < p.WIDTH + 1; j++) {
          p.line(0, j * SIZE, SIZE * p.WIDTH, j * SIZE);
        }
        for (let i = 0; i < p.WIDTH + 1; i++) {
          p.line(i * SIZE, 0, i * SIZE, SIZE * p.WIDTH);
        }
      }

      // bind different functions and variables depending on the board type
      // (your or your opponent's)
      if (p.type === 'hidden') {


        // draw crosses and gaps
        p.navy = function() {
          for (let i = 0; i < p.WIDTH; i++) {
            for (let j = 0; j < p.WIDTH; j++) {

              switch (p.cells[i][j]) {
                case EMPTY:
                  break;

                case GAP:
                  p.fill(12, 103, 136);
                  p.noStroke();
                  p.rect(i * SIZE + STROKE, j * SIZE + STROKE, SIZE - STROKE, SIZE - STROKE);
                  break;

                case SHIP:
                  p.stroke(184, 23, 23);
                  p.strokeWeight(CROSS_STROKE);
                  let x = i * SIZE;
                  let y = j * SIZE;
                  p.line(x + SM + CROSS_STROKE / 2, y + SM + CROSS_STROKE / 2,
                    x + SIZE - SM, y + SIZE - SM);
                  p.line(x + SIZE - SM, y + SM + CROSS_STROKE / 2,
                    x + SM + CROSS_STROKE / 2, y + SIZE - SM);
                  break;
              }
            }
          }
        }

        // do nothing
        p.updateSilhouette = function() {}


      } else {

        // renderer
        p.drawShip = function(ship) {
          p.fill(81, 226, 30);
          p._drawShip(ship);
        }

        p._drawShip = function(ship) {
          p.stroke(0);
          p.strokeWeight(STROKE);

          { // Sausages
            let xTop = ship.start.x * SIZE + OFFSET + STROKE;
            let xBot = ship.end.x * SIZE - OFFSET + SIZE;
            let yTop = ship.start.y * SIZE + OFFSET + STROKE;
            let yBot = ship.end.y * SIZE - OFFSET + SIZE;

            p.beginShape();
            p.vertex(xTop, yTop);
            p.vertex(xBot, yTop);
            p.vertex(xBot, yBot);
            p.vertex(xTop, yBot);
            p.endShape(CLOSE);
          }


          p.noFill();
          p.stroke(184, 23, 23);
          p.strokeWeight(CROSS_STROKE);

          for (let i of ship.inds) {
            // cross out dead cells
            if (!i.alive) {
              let posx = i.x * SIZE;
              let posy = i.y * SIZE;
              p.line(posx + SM, posy + SM,
                posx + SIZE - SM, posy + SIZE - SM);
              p.line(posx + SIZE - SM, posy + SM,
                posx + SM, posy + SIZE - SM);
            }
          }
        }

        p.drawSilh = function() {
          if (!p.shipSilhouette) return;
          if (p.shipSilhouette.meetsCriteria) p.fill(81, 226, 30, 80);
          else p.fill(228, 82, 42, 80);
          p._drawShip(p.shipSilhouette);
        }

        // holds x, y coordinates of ship that is to be created
        p.shipCreation = null;

        // hint the form of the future ship while making it
        p.shipSilhouette = null;

        // draw your navy and the gaps
        p.navy = function() {
          // draw ships
          p.ships.map(p.drawShip)
          p.deadShips.map(p.drawShip)
          p.drawSilh();

          p.fill(12, 103, 136);
          p.noStroke();

          // change color of shot tiles
          for (let g of p.gaps) {
            p.rect(g.x * SIZE + STROKE, g.y * SIZE + STROKE,
              SIZE - STROKE, SIZE - STROKE)
          }
        }

        // draw ship's silhouette that hints the player the size of the ships
        // while it is being created
        p.updateSilhouette = function(x, y) {
          if (!p.shipCreation) return;
          let ends = p.matchEnds(p.shipCreation, { x, y });

          if (!p.shipSilhouette ||

            (p.shipSilhouette.start.x !== ends.start.x ||
              p.shipSilhouette.start.y !== ends.start.y ||
              p.shipSilhouette.end.x !== ends.end.x ||
              p.shipSilhouette.end.y !== ends.end.y))

          {
            p.shipSilhouette = new Ship(ends.start, ends.end, true);
            p.meetCriteria(p.shipSilhouette);
          }
        }

        // resolve mouse click event
        p.click = function(x, y) {
          if (p.ingame) return;

          if (!p.shipCreation) {
            if (!p.isEmpty(x, y)) return;
            p.shipCreation = { x, y };
            return;
          }
          // select ends of the future ship
          if (p.shipSilhouette.meetsCriteria) {

            p.addShip(p.shipCreation, { x, y });

            // remove the silhouette
            p.shipSilhouette = null;
            p.shipCreation = null;
          }

          p.handleClick();
        }


        p.shoot = function(x, y) {

          // check if hit a ship
          for (let i = 0; i < p.ships.length; i++) {

            let eff = p.ships[i].shoot(x, y);

            if (eff.hit) {

              if (eff.kill) {
                let deadShip = p.ships.splice(i, 1)[0];
                p.finish(deadShip);
                p.deadShips.push(deadShip);

                if (p.ships.length === 0) {
                  eff.win = true;
                } else {
                  eff.win = false;
                }
              }

              return eff;
            }
          }

          // it did not hit any ships
          let notHitYet = true;

          // check if hit a gap
          for (let g of p.gaps) {
            if (g.x === x && g.y === y) {
              notHitYet = false; // it did
            }
          }

          // make the gap
          if (notHitYet) {
            p.gaps.push({ x, y });
            return {
              hit: false,
              kill: null,
              win: false
            }
          }

          return 'error';
        }

      }

      p.createCanvas(p.WIDTH * SIZE + STROKE, p.HEIGHT * SIZE + STROKE);
      p.frameRate(FRAMERATE);
    },



    // this function draws everything to the canvas ~60 times a second
    p.draw = function() {

      p.drawGrid();

      // draw the navy / enemy's navy (if hit) and the gaps
      p.navy()

      // get row and column
      let x = Math.floor(p.mouseX * SIZE_INVERSE);
      if (x < 0 || x >= p.WIDTH) return;

      let y = Math.floor(p.mouseY * SIZE_INVERSE);
      if (y < 0 || y >= p.HEIGHT) return;

      // create half-transparent ship silhouette (while making a ship)
      p.updateSilhouette(x, y);

      p.noStroke();

      // Hovering
      if (p.isEmpty(x, y) &&
      (!p.shipSilhouette || !p.shipSilhouette.check(x, y))) {
        p.fill(240, 238, 24);
        p.rect(x * SIZE + STROKE, y * SIZE + STROKE,
          SIZE - STROKE, SIZE - STROKE);
      } else {
        p.fill(240, 238, 24, 90);
        p.rect(x * SIZE + STROKE, y * SIZE + STROKE,
          SIZE - STROKE, SIZE - STROKE);
      }
    },


    p.mouseClicked = function() {

      // get row and column
      let x = Math.floor(p.mouseX * SIZE_INVERSE);
      if (x < 0 || x >= p.WIDTH) return;

      let y = Math.floor(p.mouseY * SIZE_INVERSE);
      if (y < 0 || y >= p.HEIGHT) return;

      // pass coordinates to click handlers
      p.click(x, y);
    }

  }
}
