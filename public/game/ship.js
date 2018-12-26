class Ship {
  constructor(start, finish, silhouette) {
    if (silhouette) { // if half transparent
      this.silhouette = true;
    } else {
      this.silhouette = false;
    }
    this.start = start;
    this.finish = finish;
    this.inds = [];
    for (let x = start[0]; x <= finish[0]; x++) {
      for (let y = start[1]; y <= finish[1]; y++) {
        this.inds.push({
          x,
          y,
          alive: true
        });
      }
    }

    let w = this.width();
    let h = this.height();
    if (w < h) {
      let t = w;
      w = h;
      h = t;
    }
    this.key = `${w}.${h}`;
  }

  show(p) {
    p.stroke(0);
    p.strokeWeight(1);
    if (!this.silhouette) {
      p.fill(81, 226, 30);
    } else {
      // this last 80 stands for transparency (alpha)
      if (this.meetsCriteria) p.fill(81, 226, 30, 80);
      else p.fill(228, 82, 42, 80);
    }

    { // Sausages
      let xTop = this.start[0] * SIZE + OFFSET + 1;
      let xBot = this.finish[0] * SIZE - OFFSET + SIZE;
      let yTop = this.start[1] * SIZE + OFFSET + 1;
      let yBot = this.finish[1] * SIZE - OFFSET + SIZE;

      p.beginShape();
      p.vertex(xTop, yTop);
      p.vertex(xBot, yTop);
      p.vertex(xBot, yBot);
      p.vertex(xTop, yBot);
      p.endShape(p.CLOSE);
    }


    p.noFill();
    p.stroke(184, 23, 23);
    p.strokeWeight(3);

    for (let i of this.inds) {
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
  // check is mouse (any coordinate) is inside this ship
  // shoot the ship and response with the effects
  shoot(x, y) {
    let dead = true;
    let result = {
      hit: false,
      kill: null,
      win: false
    };
    for (let i of this.inds) {
      if (!result.hit && i.x === x && i.y === y) {
        i.alive = false;
        result.hit = true;
        result.kill = this.adj;
      }
      else if (i.alive) {
        dead = false;
        if (result.hit) {
          break;
        }
      }
    }
    if (!dead) {
      result.kill = null;
    }
    return result;
  }

  outshape() {
    let r = {
      corns: [],
      tops: [],
      lefts: [],
      rights: [],
      bots: []
    };

    let s = { x: this.start[0], y: this.start[1] };
    let f = { x: this.finish[0], y: this.finish[1] };

    r.corns = [s,
      { x: f.x, y: s.y },
      { x: s.x, y: f.y },
      f];

    for (let i = s.x; i <= f.x; i++) {
      r.tops.push({ x: i, y: s.y });
      r.bots.push({ x: i, y: f.y });
    }

    for (let i = s.y; i <= f.y; i++) {
      r.lefts.push ({ x: s.x, y: i });
      r.rights.push({ x: f.x, y: i });
    }

    return r;
  }

  width() {
    return this.finish[0] - this.start[0] + 1;
  }

  height() {
    return this.finish[1] - this.start[1] + 1;
  }

  length() {
    let w = this.width();
    let h = this.height();
    return w > h ? w : h;
  }

}
