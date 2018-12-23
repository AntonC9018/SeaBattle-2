var id;
var nick;
var initiative;

var myNavy;
var enemyNavy;

var awaitingReq = false;
var awaitingRes = false;

function salt() {
  return Math.random().toString(36).substr(2, 8);
}

// at start
function setup() {
  myNavy = new p5(sketch(true), window.document.getElementById('sk1'));
  document.querySelector('.start').addEventListener('click', start);
}



var socket = io('http://localhost:3000');;

function startGame() {

  socket.emit('startGame', {
    name: nick
  });
  socket.on('startGame', function(data) {
    enemyName = data.enemyName;
    id = data.id;
    initiative = data.initiative;

    if (initiative === 1) {
      awaitingReq = true;
    }

    // enemy name container (.nick)
    enemy.children[0].innerHTML = enemyName;

    pass()

    changeState(STATE_READY)
  })

  socket.on('requestOut', function(data) {
    console.log('requestOut!');
    if (awaitingReq) {
      answerRequest(data);
    } else {
      console.log('error. Not w8ting 4 requests');
    }
  })

  socket.on('responseOut', function(data) {
    console.log('responseOut!');
    if (awaitingRes) {
      answerResponse(data)
    } else {
      console.log('error. Not w8ting 4 responses');
    }
  })

  socket.on('disconnect', function(data) {

    console.log('Enemy disconnected. You\'ve won!');
    socket.emit('refresh');
    if (!ingame) return;
    win();
  })
}


var latestshot;

function cycle(i, j) {
  if (awaitingReq || awaitingRes) {
    console.log('Awaiting req or res. Shooting not allowed');
    return;
  }
  latestshot = {
    i: i,
    j: j
  }
  socket.emit('requestIn', latestshot);
  awaitingRes = true;
}

function answerRequest(data) {
  let effect = myNavy.shoot(data.i, data.j);
  if (effect === 'error') {
    console.log('some error occured');
  } else {
    socket.emit('responseIn', effect);
    if (!effect.hit) {
      initiative = 0;
      awaitingReq = false;
      pass();
    }
    if (effect.win) {
      lose();
    }
  }
}

function answerResponse(r) {
  awaitingRes = false;

  let i = latestshot['i'];
  let j = latestshot['j'];

  if (r.hit === true) {

    changeState(STATE_READY);
    console.log('A ship has been hit!');

    enemyNavy.cells[i][j] = 2;

    if (r.kill) {
      enemyNavy.kill(r.kill.start, r.kill.finish);
      if (r.win) {
        socket.emit('refresh');
        win();
      }
    }

  } else if (r.hit === false) {

    changeState(STATE_FAIL);
    console.log('An empty space has been hit!');

    enemyNavy.cells[i][j] = 1;
    initiative = 1;
    pass();

    awaitingReq = true;
  }
}

function state() {
  console.log((awaitingReq ? 'Awaiting request' : '\n') + (awaitingRes ? 'Awaiting response' : ''));
}

function stop() {
  awaitReq = false;
  awaitRes = false;
}

function lose() {
  console.log('u lose');
  win()
}

function win() {
  console.log('win');
  document.querySelector('#sk1 canvas').remove();
  document.querySelector('#sk2 canvas').remove();
  enemyNavy = null;
  let enemy = document.getElementById('enemy');
  enemy.classList.add('hidden');
  let startbtn = document.querySelector('.button.start');
  startbtn.classList.remove('hidden');
  ingame = false;
  initiative = undefined;
  awaitingReq = awaitingRes = false;
  changeState(STATE_HIDDEN);
  pass();
  setup();
}
