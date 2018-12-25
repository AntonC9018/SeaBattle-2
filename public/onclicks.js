// tick — waiting
function changeState(state) {
  let el = document.getElementById('stateScreen');
  let cl = el.className;

  if (state) {
    el.className = stateClasses[state];
    stateScreen.reset();
    stateScreen.state = state;
  } else if (cl === stateClasses[STATE_WAITING]) {
    el.className = stateClasses[STATE_HIDDEN];
  } else {
    el.className = stateClasses[STATE_HIDDEN];
  }

}

window.addEventListener('resize', setOffset);

// offset stateScreen (see state.js)
function setOffset() {
  let elstate = document.getElementById('stateScreen');
  let elsket = document.querySelector('#enemyNavy canvas');

  if (!elsket) return;

  let coords = elsket.getBoundingClientRect();

  elstate.style.left = coords.left + 'px';
  elstate.style.top = coords.top + 'px';
  elstate.style.width = coords.width + 'px';
  elstate.style.height = coords.height + 'px';
}

// create board for enemy navy
function board() {
  enemyNavy = new p5(sketch(false), window.document.getElementById('enemyNavy'));
}

// on "start"-button click
function start() {
  if (!debugging) {
    for (let key of Object.keys(myNavy.criteria)) {
      if (myNavy.criteria[key] !== 0) {
        return;
      }
    }
  }

  myNavy.shipSilhouette = null;

  let enemy = document.getElementById('enemyNavy');
  enemy.classList.remove('hidden');

  this.removeEventListener('click', start);
  this.classList.add('hidden');

  // create board for enemy navy and
  board();

  // offset the stateScreen
  setOffset();

  // let the thing run
  changeState(STATE_WAITING);

  // get nick
  let el = document.querySelector('.nick');
  el.setAttribute('contenteditable', 'false');
  nick = salt() + el.innerHTML;

  let rn = document.getElementById('random-nick')
  if (rn) rn.remove()

  ingame = true; // change game state when button is clicked

  startGame();

}


function sendmsg() {
  if (!ingame) return;
  let msgcont = document.getElementById('message-content');
  let msg = msgcont.value;
  msgcont.value = '';

  let div = document.getElementById('history');

  let span = document.createElement('span');
  span.classList.add('mine');
  span.innerHTML = msg;
  div.innerHTML += '<br>' + nick.slice(8) + ':';
  div.append(span);

  span.scrollIntoView();

  socket.emit('chat', msg);
}

function randomNick() {
  document.querySelector('#myNavy .nick').innerHTML = randName();
}
