const Game = require('./models/Game.js')
const mongoose = require('mongoose');
const _ = require('lodash/array');

module.exports = function(db) {
  return {
    // db: db,
    runningGames: [],
    reqs: {},

    // new game (games)
    game: function() {
      if (mongoose.readyState === 0) return null;

      return new Promise((resolve, reject) => {

        if (arguments.length === 1) {
          let game = new Game({
            players: arguments[0], // nicknames
            turn: 0,
            initiative: 0, // 0 is first player 1 second
            request: null,
            response: null,
            start: Date.now(),
            boards: _.chunk(_.chunk(Array(200),10),10)
          });
          game.save((err, g) => {
            this.runningGames.push(g._id.toString());
            resolve(g._id.toString());
            if (err) reject(err);
          })

        } else {
          reject('Invalid parameters')
        }
      })
    },

    getGame: function(id) {
      let done = false;

      return new Promise((resolve, reject) => {
        for (let i = 0; i < this.runningGames.length; i++) {
          if (this.runningGames[i] == id) {
            done = true;
            Game.findOne({ '_id': id }, (err, res) => {
              resolve(res);
              if (err) reject(err);
            })
          }
        }
        if (!done) resolve(null);
      })
    },

    // return all running games
    list: function() {

      let rg = this.runningGames;

      // auxiliary recursive function
      function _list(index, result) {
        return new Promise((resolve, reject) => {
          Game.findOne({ '_id': rg[index] }, (err, res) => {
            result.push(res);

            if (index === rg.length - 1) {
              resolve(result);
            } else {
              _list(index + 1, result).then(data => {
                resolve(result);
                if (err) reject(err);
              });
            }
          })
        })
      }

      return new Promise((resolve, reject) => {
        if (rg.length === 0) resolve(null)
        else _list(0, []).then(data => resolve(data))
      })
    },

    // rerun all games saved to db
    // useful at server restart
    restore: function() {
      Game.find({}, (err, data) =>
      data.forEach(val => this.runningGames.push(val._id.toString())))
    },

    drop: function(db) {
      db.collections.games.drop();
      this.runningGames = [];
    },


    // Delete the game record
    end: function(id) {
      for (let i = 0; i < this.runningGames.length; i++)
        if (this.runningGames[i] === id) {
          Game.findByIdAndRemove(id);
          this.runningGames.splice(i, 1);
          return;
        }
    },

    // Outsiders can only see boards from enemy's point of view
    // i.e. cannot see the arrangement of the ships
    update: function (id, data) {
      return new Promise((resolve, reject) => {
        if (data.i !== undefined && data.i !== null) {
          this.reqs[id] = data;
          console.log('Resolving with false');
          resolve(false);
        } else {
          let req = this.reqs[id];

          // cell to shoot
          let field = `boards.${req.target}.${req.i}.${req.j}`;

          let $set = {};
          let query = { $set };

          if (data.hit) {
            $set[field] = 2; // set the cell shot to a ship
            if (data.kill) {
              for (let cell of data.kill) {
                let field = `boards.${req.target}.${cell[0]}.${cell[1]}`
                $set[field] = 1;
              }
            }
          } else {
            // Pass the initiative and record a turn has passed
            query.initiative = req.target ? 0 : 1;
            query.$inc = { turn: 1 }
            $set[field] = 1; // set the cell shot to a gap
          }

          Game.update({ "_id": id }, query,
          (err, res) => {
            console.log('Resolving with ' + JSON.stringify(req));
            if (err) reject(err);
            else resolve(req);
          })
        }
      });
    }
  }
}
