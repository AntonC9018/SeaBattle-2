class Ship {
  constructor(start, finish, silhouette) {
    if (silhouette) { // if half transparent
      this.silhouette = true;
    } else {
      this.silhouette = false;
    }
    this.start = start;
    this.finish = finish;
    this.pos = [];
    this.inds = [];
    for (let x = start[0]; x <= finish[0]; x++) {
      for (let y = start[1]; y <= finish[1]; y++) {
        this.pos.push({
          x: x * SIZE,
          y: y * SIZE,
          alive: true
        });
        this.inds.push({
          x,
          y
        });
      }
    }
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

    for (let po of this.pos) {
      // cross out dead cells
      if (!po.alive) {
        p.line(po.x + SM, po.y + SM,
          po.x + SIZE - SM, po.y + SIZE - SM);
        p.line(po.x + SIZE - SM, po.y + SM,
          po.x + SM, po.y + SIZE - SM);
      }
    }
  }
  // check is mouse (any coordinate) is inside this ship
  shoot(x, y) {
    let dead = true;
    let result = {
      hit: false,
      kill: null,
      win: false
    };
    for (let po of this.pos) {
      if (!result.hit && po.x < x && po.x + SIZE > x
        && po.y < y && po.y + SIZE > y) {
        po.alive = false;
        result.hit = true;
        result.kill = { start: this.start, finish: this.finish }
      } else {
        if (po.alive) dead = false;
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

    let s = {x: this.start[0], y: this.start[1]};
    let f = {x: this.finish[0], y: this.finish[1]};

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

  meet(criteria) {
    if (CRITERIA === 'any') {
      this.meetsCriteria = true;
      return;
    }
    for (let ship of myNavy.ships) {
      for (let i of myNavy.calcAdjacent(ship)) {
        for (let j of this.inds) {
          if (i[0] === j['x'] && i[1] === j['y']) {
            return this.meetsCriteria = false;
          }
        }
      }
    }
    let w = this.width();
    let h = this.height();
    if (w < h) {
      let t = w;
      w = h;
      h = t;
    }
    if (criteria[`${w}.${h}`] && criteria[`${w}.${h}`] >= 0) {
      this.meetsCriteria = true;
    }
    else this.meetsCriteria = false;
  }
}
