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



// on "start"-button click
function start() {
  initiative = undefined;
  
  if (!myNavy.debugging) {
    for (let key of Object.keys(myNavy.schema)) {
      if (myNavy.schema[key] !== 0) {
        return;
      }
    }
  }

  document.getElementById('random-arrangement').classList.add('hidden');

  myNavy.shipSilhouette = null;

  let enemy = document.getElementById('enemyNavy');
  enemy.classList.remove('hidden');

  this.removeEventListener('click', start);
  this.classList.add('hidden');

  // create board for enemy navy
  enemyNavy = createSketch({ type: "hidden", click: cellClicked },
    window.document.getElementById('enemyNavy'));

  // offset the stateScreen
  setOffset();

  // get nick
  let el = document.querySelector('.nick');
  el.setAttribute('contenteditable', 'false');
  nick = salt() + el.innerHTML;

  let rn = document.getElementById('random-nick')
  if (rn) rn.remove()

  myNavy.ingame = true; // change game state when button is clicked

  if (!usebot) {
    // let the thing run
    changeState(STATE_WAITING);
    startGame();
  } else {
    enemyName = 'The Random Bot';
    window.document.getElementById('enemyNavy').querySelector('.nick').innerHTML = enemyName;
    createBot();
    setTimeout(() => initiative = 0, 200);
  }
}


function sendmsg() {
  let msgcont = document.getElementById('message-content');
  let msg = msgcont.value;
  msgcont.value = '';

  let div = document.getElementById('history');

  let span = document.createElement('span');
  span.classList.add('mine');
  span.innerHTML = msg;

  let name = nick ? nick.slice(8) :
  document.querySelector('#myNavy .nick').innerHTML;

  if (name === '') name = 'anon';

  div.innerHTML += '<br>' + name + ':';
  div.append(span);

  span.scrollIntoView();

  socket.emit('chat', msg, name);
}

function randomNick() {
  document.querySelector('#myNavy .nick').innerHTML = randName();
}

var usebot = false;

function uncheck() {
  usebot = !usebot;
}


// $('#random-arrangement').click(() => randomArrangement(myNavy));

document.getElementById('random-arrangement').addEventListener('click', () => {
  randomArrangement(myNavy);
})
