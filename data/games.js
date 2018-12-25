const Game = require('./models/Game.js')
const mongoose = require('mongoose');
const _ = require('lodash');

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
            boards: [_.chunk(_.fill(Array(100), 0), 10)
              ,_.chunk(_.fill(Array(100), 0), 10)]
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
      return new Promise((resolve, reject) => {
        if (this.runningGames.length === 0) resolve(null)
        else this._list(0, []).then(data => resolve(data))
      })
    },

    // auxiliary recursive function
    _list: function(index, result) {
      return new Promise((resolve, reject) => {
        Game.findOne({ '_id': this.runningGames[index] }, (err, res) => {
          result.push(res);

          if (index === this.runningGames.length - 1) {
            resolve(result);
          } else {
            this._list(index + 1, result).then(data => {
              resolve(result);
              if (err) reject(err);
            });
          }
        })
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
    },

    // end request-respond cycle
    pass: function(id, ini) {

      return new Promise((resolve, reject) => {

        console.log('Passing initiative to player ' + ini);

        if (this.runningGames.includes(id)) {
            Game.findOneAndUpdate({ '_id': id },
            { initiative: ini, $inc: { turn: 1 } },
            (err, res) => {
              if (!err) resolve(res)
              else reject(err)
            })
        }
      })
    },

    end: function(id) {
      for (let i = 0; i < this.runningGames.length; i++)
        if (this.runningGames[i] === id) {
          Game.findByIdAndRemove(id);
          this.runningGames.splice(i, 1);
          return;
        }
    },

    update: function (id, data) {
      new Promise(function(resolve, reject) {
        if (data.i !== undefined) {
          console.log(data);
          this.reqs[id] = data;
          resolve(false);
        } else {
          let field = `boards.${this.reqs[id].token}.${this.reqs[id].i}.${this.reqs[id].j}`;
          console.log(field);
          let $set = {};
          $set[field] = data.hit ? 2 : 1;
          Game.update({ "_id": id }, { $set },
          (err, res) => {
            if (err) reject(err);
            else resolve(this.reqs[id]);
            console.log('Error:' + err);
            console.log('Result: ' + res);
          })
        }
      });
    }
  }
}
