const Game = require('./models/Game.js')
const mongoose = require('mongoose');
module.exports = function(db) {
  return {
    // db: db,
    runningGames: [],

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
            start: Date.now()
          });
          game.save((err, g) => {
            this.runningGames.push(g._id.toString());
            resolve(g._id.toString());
            if (err) reject(err);
          })

        } else {
          this._game(Array.from(arguments))
            .then(res => resolve(res))
        }
      })
    },

    // Recursive function
    _game: function(data, result) {
      if (!result) result = [];

      return new Promise((resolve, reject) => {

          this.game(data[0])
            .then((id) => {
              result.push(id);

              if (data.length === 1) {
                resolve(result);
              } else {
                this._game(data.slice(1), result)
                .then((res) => {
                  resolve(res);
                })
              }
            })
        })
    },

    getGame: function(id) {
      id = id.toString();
      let done = false;
      let curr = this.runningGames;

      return new Promise(function(resolve, reject) {
        for (let i = 0; i < curr.length; i++) {
          if (curr[i] == id) {
            done = true;
            Game.findOne({
              '_id': id
            }, function(err, res) {
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

        if (this.runningGames.length === 0) {
          resolve(null)
        } else {
          this._list(0, [])
            .then(function(data) {
              resolve(data);
            })
        }
      })
    },

    // auxiliary recursive function
    _list: function(index, result) {
      return new Promise((resolve, reject) => {
        Game.findOne({
          '_id': this.runningGames[index]
        }, (err, res) => {
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
    }
  }
}
