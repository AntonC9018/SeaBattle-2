var id;
var nick;
var initiative = undefined;

var myNavy;
var enemyNavy;

var awaitingReq = false;
var awaitingRes = false;


function debug(password) {
  if (password === 123) {
    myNavy.debugging = true;
    myNavy.SCHEMA = 'any';
  }
}


window.addEventListener('keypress', function(event) {
  if (event.which === 32) {
    if (myNavy.shipSilhouette) {
      myNavy.shipCreation = null;
      myNavy.shipSilhouette = null;
    } else {
      myNavy.undo();
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

  socket.on('start game', function(data) {

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
    if (!myNavy.ingame) return;
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
  myNavy = createSketch({
      type: "visible",
      click: () => console.log('mouse clicked'),
      win,
      lose
    },
    document.getElementById('myNavy'));

  document.querySelector('.start').addEventListener('click', start);
}

function startGame() {
  console.log('Starting new game!');
  socket.emit('start game', { name: nick });
}


var latestshot;

function cellClicked(x, y) {

  if (initiative === undefined || enemyNavy.cells[x][y] !== 0 || initiative !== 0) return;
  console.log('Cell clicked');
  if (usebot) {
    botCellClicked(x, y)
    return;
  }


  if (awaitingReq || awaitingRes) {
    console.log('Awaiting req or res. Shooting not allowed');
    return;
  }

  latestshot = { x, y }
  socket.emit('requestIn', latestshot);
  changeState(STATE_WAITING);
  awaitingRes = true;
}

function answerRequest(data) {
  let effect = myNavy.shoot(data.x, data.y);
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

  let x = latestshot.x;
  let y = latestshot.y;

  enemyNavy.record(x, y, r);

  if (r.hit) {
    changeState(STATE_READY);
    console.log('A ship has been hit!');


      if (r.win) {
        socket.emit('refresh');
        console.log('Calling win() from answerResponse()');
    }

  } else {

    changeState(STATE_FAIL);
    console.log('An empty space has been hit!');
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
  let enBoard = document.querySelector('#enemyNavy canvas');
  if (!enBoard) return;
  enBoard.remove();

  document.querySelector('#myNavy canvas').remove();
  document.getElementById('random-arrangement').classList.remove('hidden')

  let enemy = document.getElementById('enemyNavy');
  enemy.classList.add('hidden');
  enemyName = '';
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


// BOT STUFF
var bot;
var botBoard;

function createBot() {
  botBoard = createLogic({ type: 'visible' });
  randomArrangement(botBoard);
  bot = new RandomBot({
    WIDTH: 10,
    HEIGHT: 10,
    fun: botShoot
  });
}

function botShoot(x, y) {
  console.log('BOT IS SHOOTING');
  let eff = myNavy.shoot(x, y);
  if (!eff.hit) {
    initiative = 0;
  } else {
    if (eff.win) {
      lose();
    } else {
      setTimeout(() => bot.act(), 800);
    }
  }
  return eff;
}

function botCellClicked(x, y) {
  if (initiative !== 0) return;
  initiative = 1;
  let eff = botBoard.shoot(x, y);
  console.log(eff);
  enemyNavy.record(x, y, eff);
  if (!eff.hit) {
    console.log('passing initiative');
    setTimeout(() => bot.act(), 800);
  } else {
    if (eff.win) {
      win();
    }
    initiative = 0;
  }
}
