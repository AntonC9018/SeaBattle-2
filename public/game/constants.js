const SIZE = 35;
const OFFSET = SIZE / 8;
const HALFSIZE = SIZE / 2;
const WIDTH = 10;
const HEIGHT = 10;
const SM = 5;
var ingame; // making ships / destroying ships
var debugging = false;

const CRITERIA = {
  '4.1': 1,
  '3.1': 2,
  '2.1': 3,
  '1.1': 4
}
// const CRITERIA = 'any';
const STATE_HIDDEN = 0
STATE_WAITING = 1
STATE_READY = 2
STATE_FAIL = 3;

const stateClasses = [
  'hidden',
  'waiting',
  'ready',
  'fail'
]


function debug(password) {
  if (password === 123) {
    debugging = true;
    myNavy.criteria = 'any';
  }

}

const EMPTY = 0
GAP = 1
SHIP = 2;
