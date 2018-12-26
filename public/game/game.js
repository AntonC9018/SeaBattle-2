var id;
var nick;
var initiative = undefined;

var myNavy;
var enemyNavy;

var awaitingReq = false;
var awaitingRes = false;


window.addEventListener('keypress', function(event) {
  if (event.which === 32) {
    if (myNavy.shipSilhouette) {
      myNavy.shipCreation = [];
      myNavy.shipSilhouette = null;
      myNavy.silhouette = false;
    } else {
      if (ingame) return;
      if (myNavy.ships.length === 0) return;
      let ship = myNavy.ships.splice(-1, 1)[0];
      // update occupied cells
      myNavy.occupiedCells.splice(-ship.span, ship.span);
      myNavy.criteria[ship.key]++
    }
  }
})

function salt() {
  return Math.random().toString(36).substr(2, 8);
}

var socket = io();
installSocket();

function installSocket() {
  socket.on('chat', function(msg, name) {
    console.log('new message!');
    let div = document.getElementById('history');
    let span = document.createElement('span');
    span.classList.add('enemy');
    span.innerHTML = msg;
    div.innerHTML += '<br>' + name + ':';
    div.append(span);
    span.scrollIntoView();
  })

  socket.on('startGame', function(data) {

    console.log('Game started');
    enemyName = data.enemyName.slice(8);
    id = data.id;
    initiative = data.initiative;

    if (initiative === 1) {
      awaitingReq = true;
    }

    // enemy name container (.nick)
    enemy.children[0].innerHTML = enemyName;

    pass()

    changeState(STATE_READY)

    socket.emit('start')
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

  socket.on('connection closed', function(data) {

    console.log('Enemy disconnected. You\'ve won!');
    socket.emit('refresh');
    if (!ingame) return;
    console.log('Calling win from disconnect');
    win();
  })

  socket.on('disconnect', function(data) {
    console.log('Server offed');
    refresh();
  })
}

// at start
function setup() {
  myNavy = new p5(sketch(true), window.document.getElementById('myNavy'));
  document.querySelector('.start').addEventListener('click', start);
}

function startGame() {
  console.log('Starting new game!');
  socket.emit('startGame', { name: nick });
}


var latestshot;

function cellClicked(i, j) {
  console.log('Cell clicked');
  if (initiative === undefined || (enemyNavy.cells[i][j] !== 0 && initiative !== 0)) return;

  if (awaitingReq || awaitingRes) {
    console.log('Awaiting req or res. Shooting not allowed');
    return;
  }

  latestshot = { i, j }
  socket.emit('requestIn', latestshot);
  changeState(STATE_WAITING);
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
      socket.emit('refresh');
      console.log('Calling lose() from answerRequest()');
      lose();
    }
  }
}

function answerResponse(r) {
  awaitingRes = false;

  let i = latestshot.i;
  let j = latestshot.j;

  if (r.hit === true) {

    changeState(STATE_READY);
    console.log('A ship has been hit!');

    enemyNavy.cells[i][j] = 2;

    if (r.kill) {
      console.log(r.kill);
      enemyNavy.kill(r.kill);
      if (r.win) {
        socket.emit('refresh');
        console.log('Calling win() from answerResponse()');
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
  refresh();
}

function win() {
  console.log('win');
  refresh();
}

function refresh() {
  if (!ingame) return;
  document.querySelector('#myNavy canvas').remove();
  document.querySelector('#enemyNavy canvas').remove();

  let enemy = document.getElementById('enemyNavy');
  enemy.classList.add('hidden');
  enemyNavy = '';
  document.querySelector('#enemyNavy .nick').innerHTML = '';

  let startbtn = document.querySelector('.button.start');
  startbtn.classList.remove('hidden');
  ingame = false;
  initiative = undefined;
  awaitingReq = awaitingRes = false;
  changeState(STATE_HIDDEN);
  pass();
  setup();
}

function ping(meth, msg) {
  socket.emit('pint', meth, msg);
}
