const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./data/connection.js');
const port = process.env.PORT || 3000;
const play = require('./data/games.js')();

var queue = [];
var resp = {};

var timeout = require('connect-timeout');

var time = require('express-timestamp');

app.use(time.init);

app.use(timeout(1000 * 60 * 2));
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))

// parse application/json
app.use(bodyParser.json());


//play.restore();
play.drop(db)

app.use(express.static(__dirname + '/public'))


app.set('view engine', 'ejs')



const REQ_IN = 0
REQ_OUT = 1
RES_IN = 2
RES_OUT = 3
CLEAR = 4
NEW_GAME = 5;

// This way is more understandable for me
// Same thing could've been done with a router
app.post('/games', function(req, res, next) {
  let r = req.body;

  console.log('In router. Data: ');
  console.log(r);

  switch (r.type) {
    case REQ_IN:
      reqIn(req, res);
      break;

    case REQ_OUT:
      reqOut(req, res);
      break;

    case RES_IN:
      resIn(req, res);
      break;

    case RES_OUT:
      resOut(req, res);
      break;

    case CLEAR:
      clear(req, res);
      break;

    case NEW_GAME:
      game(r.query.name, res);
      break;

    default:
      res.end('{"error":"Invalid route parameters"}');
  }
})

// player waiting for response
// wait for hit info and get it
function resOut(req, res) {
  let query = req.body.query;
  let id = query.id;
  let name = query.name;

  console.log('player ' + name.slice(8) + ' waiting for response');

  play.getGame(id).then((r) => {

    let answer = {}

    // Validation
    if (!r) answer.error = 'no such game'
    else if (!r.players.includes(name)) answer.error = 'not in this game'
    else if (r.request && r.request.from != name) answer.error = 'send request'
    else {
      let i = r.players[0] == name ? 0 : 1;
      if (r.initiative != i) answer.error = 'not your turn'
      else {

        // No discrepancy found (data is valid)
        _endResponse(id, name, res, r).then(r => {
          if (r) return;
          else {

            // Repeat without the check (validation)
            setInterval(function() {
              play.getGame(id).then((r) => {

                _endResponse(id, name, res, r).then(r => {
                  if (r) {
                    clearInterval(this);
                    return;
                  }
                  if (req.timestamp - Date.now() > 1000 * 60 * 2) {
                    clearInterval(this);
                  }
                })
              })
            }, 600)
          }
        })
      }
    }

    if (answer.error) {
      res.end(JSON.stringify(answer));
    }
  })
}

function _endResponse(id, name, res, r) {

  return new Promise(function(resolve, reject) {

    let rp = r.response;
    if (rp && rp.from != name) {

      let skip = function(id, answer) {
        play.clear(id);

        answer = {
          response: {
            hit: rp.hit,
            kill: rp.kill,
            win: rp.win
          }
        }
        res.end(JSON.stringify(answer));
        resolve(true);
      }
      console.log('Response at _endResponse');
      console.log(rp);

      if (rp.hit == false) {
        let i = r.players[0] == name ? 1 : 0;
        play.pass(id, i).then(r => {
          skip(id, answer);
        });
      } else {
        skip(id, answer);
      }
    } else {
      resolve(false)
    }
  })
}


// player sending a response
function resIn(req, res) {
  let query = req.body.query;

  let id = query.id;
  let name = query.name;
  let hit = query.hit;
  let kill = query.kill;
  let win = query.win;

  console.log('player ' + name.slice(8) + ' sending a response');

  play.getGame(id).then(function(r) {

    let answer = {};

    // Validation
    if (!r) answer.error = 'no such game';
    else if (!r.players.includes(name)) answer.error = 'you are not in this game'
    else if (r.response && r.response.from == name) answer.error = 'already responded'
    else if (r.request && r.request.from == name) res.end('you must wait for response')
    else {
      let i = r.players[0] == name ? 0 : 1;
      if (r.initiative == i) answer.error = 'your turn'

      // Save response to db
      else play.inter(id, {
        type: 'response',
        body: {
          from: name,
          hit,
          kill,
          win
        }
      }).then(r => {
        answer.response = 'success';
        res.end(JSON.stringify(answer));
      })
    }

    if (answer.error) {
      res.end(JSON.stringify(answer))
    }
  })
}


// Shoot a tile (send a request)
function reqIn(req, res) {
  let query = req.body.query;
  let id = query.id;
  let name = query.name;
  let x = query.x;
  let y = query.y;

  console.log('player ' + name.slice(8) + ' sending a request');

  play.getGame(id).then((r) => {

    let answer = {};

    // Validation
    if (!r) answer.error = 'no such game'
    else if (!r.players.includes(name)) answer.error = 'you are not in this game'
    else if (r.request && r.request.from == name) answer.error = 'request already sent'
    // else if (r.response && r.response.from != name) res.end('response first')
    else {
      let i = r.players[0] == name ? 0 : 1;
      if (r.initiative != i) answer.error = 'not your turn'

      // send Request
      else play.inter(id, {
        type: 'request',
        body: {
          from: name,
          coordinates: {
            x: x,
            y: y
          }
        }
      }).then((r) => {
        if (r) answer.response = 'success';
        res.end(JSON.stringify(answer));
      })
    }

    if (answer.error) {
      res.end(JSON.stringify(answer));
    }
  })
}


// Wait for request and get it
// (Get coordinates of the tile being shot)
function reqOut(req, res) {
  let query = req.body.query;
  let id = query.id;
  let name = query.name;

  console.log('player ' + name.slice(8) + ' waiting for request');

  play.getGame(id).then((r) => {

    let answer = {};

    // Validation
    if (!r) answer.error = 'no such game'
    else if (!r.players.includes(name)) answer.error = 'not in this game'
    else if (r.request && r.request.from == name) answer.error = 'wait for response'
    else {
      let i = r.players[0] == name ? 0 : 1;
      if (r.initiative == i) answer.error = 'your turn to atack'
      else {

        // No discrepancy found (data is valid)
        if (_endRequest(name, r, res)) {
          return;
        }

        // Repeat without the check (validation)
        let t = setInterval(function() {
          play.getGame(id).then((r) => {
            console.log('Still there');

            if (_endRequest(name, r, res)) {
              clearInterval(this);
              return;
            }
            if (req.timestamp - Date.now() > 1000 * 60 * 2) {
              clearInterval(this);
            }
          })
        }, 600)
      }
    }

    if (answer.error) {
      res.end(JSON.stringify(answer));
    }
  })
}

// auxiliary function for reqOut()
function _endRequest(name, r, res) {
  let rt = r.request;
  if (rt && rt.coordinates && rt.from != name) {
    answer = {
      response: {
        coordinates: {
          x: rt.coordinates.x,
          y: rt.coordinates.y
        }
      }
    };
    res.end(JSON.stringify(answer));
    return true;
  }
  return false;
}


// This one is necessary to make sure the enemy received the response
// (Responses and requests are cleared on receiving responses)
function clear(req, res) {
  let id = req.body.query.id;

  setInterval(function() {

    play.getGame(id).then(r => {

      if (r && !r.response) {
        console.log('Clear Complete!');
        res.end('{"response": "done"}');
        clearInterval(this);
      }
      if (req.timestamp - Date.now() > 1000 * 60 * 2) {
        clearInterval(this);
      }
    })
  }, 800)


}



// Register a new game
function game(name, res) {
  console.log('Player ' + name.slice(8) + ' waiting for game');

  let answer = {};

  if (queue.length > 0) { // start a game if there are people waiting
    if (queue.length > 1) {
      answer.error = 'too many players';
      res.end(JSON.stringify(answer));
      return;
    }
    let enemyName = queue[0];

    queue.push(name);

    play.game([enemyName, name])
      .then(function(id) {

        resp[enemyName] = id.toString();

        // set answer values
        answer.response = {
          id: resp[enemyName],
          enemyName: enemyName,
          initiative: 1
        };

        res.end(JSON.stringify(answer)); // send id to client
        // 1 means it goes second
        return;
      })
      .catch(err => console.log('Error: ' + err));

  } else {
    console.log(name);
    queue.push(name)
    let t = setInterval(function() {
      if (resp[name]) { // you were added to a game

        clearInterval(t);

        let enemyName = queue.splice(0, 2)[1];

        // set answer values
        answer.response = {
          id: resp[name],
          enemyName: enemyName,
          initiative: 0
        };

        res.end(JSON.stringify(answer)); // send id to client
        // 0 means it goes first
        return;
      }
    }, 100)
  }
}

// list the games running
app.get('/games', function(req, res) {
  play.list().then((data) => {
    res.render('games.ejs', {
      games: data
    });
  })
})

app.listen(port, () => console.log(`App listening on port ${port}.`))
//188.244.22.148
