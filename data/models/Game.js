const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = new Schema({
  players: [String], // nicknames
  turn: Number,
  initiative: Number, // 0 is first player 1 second
  start: Number,
  rules: {},
  boards: []
});
const game = mongoose.model('game', GameSchema);

module.exports = game;
