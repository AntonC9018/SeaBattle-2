// tick — waiting
function changeState(state) {
  let el = document.getElementById('sk3');
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
  let elstate = document.getElementById('sk3');
  let elsket = document.querySelector('#sk2 canvas');

  if (!elsket) return;

  let coords = elsket.getBoundingClientRect();

  elstate.style.left = coords.left + 'px';
  elstate.style.top = coords.top + 'px';
  elstate.style.width = coords.width + 'px';
  elstate.style.height = coords.height + 'px';
}

// create board for enemy navy
function board() {
  enemyNavy = new p5(sketch(false), window.document.getElementById('sk2'));
}

// on "start"-button click
function start() {

  myNavy.shipSilhouette = null;

  let enemy = document.getElementById('enemy');
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


  ingame = true; // change game state when button is clicked

  startGame();

}
