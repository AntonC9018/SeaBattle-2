var id;
var nick;
var initiative;

var myNavy;
var enemyNavy;

var awaitingReq = false;
var awaitingRes = false;

const REQ_IN = 0
REQ_OUT = 1
RES_IN = 2
RES_OUT = 3
CLEAR = 4
NEW_GAME = 5;

function salt() {
  return Math.random().toString(36).substr(2, 8);
}

 // at start
{
  myNavy = new p5(sketch(true), window.document.getElementById('sk1'));
  document.querySelector('.start').addEventListener('click', start);
}


// Starts a full request — await respond — await request — respond cycle
// The function are listed below in sequential order
function cycle(i, j) {
  if (awaitingReq || awaitingRes) {
    console.log('Awaiting req or res. Shooting not allowed');
    return;
  }
  console.log('start chain');

      // chain full request-respond cycle !!!
      requestAwaitRes(i, j).then(r => {
        if (r.hit) return;
        else {
          // wait for request and respond
          awaitReqRespond();
        }
      }).catch(err => console.log('An error occured while waiting for respond: ' + err + '. The cycle has been stopped unexpectedly'));
}

function requestAwaitRes(i, j) {

  return new Promise(function(resolve, reject) {
    // send request
    request(i, j).then(res => {
      console.log('Request successful.');


      // wait for response
      awaitRes().then(res => {
        console.log('Response acquired: ');
        console.log(res);

        if (res.hit) { // it hit a ship
          console.log('A ship has been hit!');
          // initiative = 0;
          enemyNavy.cells[i][j] = 2;

          if (res.kill) {
            enemyNavy.kill(res.kill.start, res.kill.finish);
          }
          if (res.win) {
            win();
          }
          resolve(res);

        } else if (res.hit === false) { // it hit an empty space
          console.log('An empty space has been hit!');
          initiative = 1;
          pass();
          enemyNavy.cells[i][j] = 1;
          resolve(res);

        } else {
          console.log('error: ' + res);
          reject(res)
        }
      }).catch(err => console.log('An error occured while waiting for response. Error: ' + err))
    }).catch(err => console.log('An error occured while requesting. Error: ' + err))
  })
}


// These functions are key for player-server interactions
function request(x, y) {

  console.log('sending a request');
  return new Promise(function(resolve, reject) {

    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let res = JSON.parse(this.responseText);
        if (res.response) {
          resolve(res.response);
        } else {
          reject(res.error);
        }
      }
    }

    xhttp.open("POST", `games`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
      type: REQ_IN,
      query: {
        id,
        name: nick,
        x,
        y
      }
    }));
  })
}

function awaitRes() {

  awaitingRes = true;
  return new Promise(function(resolve, reject) {

    if (awaitingReq) {
      reject('You are waiting for request')
      return;
    }

    changeState(STATE_WAITING);

    console.log('Waiting for response');
    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {

        let res = JSON.parse(this.responseText);

        if (res.response) {

          awaitingRes = false;

          if (res.response.hit === true) {
            changeState(STATE_READY);
          } else if (res.response.hit === false) {
            changeState(STATE_FAIL);
          }
          console.log('The response');
          console.log(res.response);
          resolve(res.response);

        } else {
          awaitingRes = false;
          console.log('error: ' + res.error);
          reject(res.error);
        }
      }
    }

    xhttp.open("POST", `games` , true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
      type: RES_OUT,
      query: {
        id, name: nick
      }
    }));
  });
}

function awaitReq() {
  return new Promise(function (resolve, reject) {
    console.log('Checking if respond = null');
    requestClear().then(r => {

        console.log('waiting for REQUEST');
        _awaitReq().then(function(res) {
        let x = res.x;
        let y = res.y;

        let effect = myNavy.shoot(x, y);
        console.log(`Being shot at ${x}, ${y}. The effect: ${effect}`);
        if (effect !== 'error') {
          resolve(effect);
        } else {
          reject(effect);
        }
      })
    })
  })
}

function _awaitReq() {

  awaitingReq = true;

  return new Promise(function(resolve, reject) {

    if (awaitingRes) {
      reject('You are waiting for response!');
      return;
    }


    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let res = JSON.parse(this.responseText);
        if (res.response) {
          awaitingReq = false;
          resolve(res.response.coordinates);
        } else {
          awaitingReq = false;
          reject(res.error);
        }
      }
    }

    xhttp.open("POST", `games` , true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
      type: REQ_OUT,
      query: {
        id, name: nick
      }
    }));
  });
}

function respond(message) {
  return new Promise(function(resolve, reject) {
    console.log('Sending a response');
    console.log(message);
    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let res = JSON.parse(this.responseText);
        if (res.response) {
          resolve(res.response);
        } else {
          reject(res.error);
        }
      }
    }

    xhttp.open("POST", `games` , true);
    xhttp.setRequestHeader("Content-type", "application/json");

    xhttp.send(JSON.stringify({
      type: RES_IN,
      query: {
        name: nick,
        id: id,
        hit: message.hit,
        kill: message.kill,
        win: message.win
      }
    }));
  });
}

function awaitReqRespond() {
  awaitReq().then(effect => {
    console.log('Request acquired. Responding');

    respond(effect).then(res => {
      if (effect.hit === true) {

        requestClear().then(r => {
          if (r) awaitReqRespond();
        })
        return;
      } else {
        initiative = 0;
        pass();
        console.log('cycle ended!');
      }


    }).catch(err => console.log('An error occured while responding. ' + err + '. The cycle has been stopped unexpectedly'))
  }).catch(err => console.log('An error occured while waiting for request: ' + err + '. The cycle has been stopped unexpectedly'))
}


function requestClear() {
return new Promise(function(resolve, reject) {

    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let r = JSON.parse(this.responseText);
        if (r.response === 'done') {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    }

    xhttp.open("POST", `games` , true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
      type: CLEAR,
      query: {
        id
      }
    }));
  })
}





function state() {
  console.log((awaitingReq ? 'Awaiting request' : '\n') + (awaitingRes ? 'Awaiting response' : ''));
}

function stop() {
  awaitReq = false;
  awaitRes = false;
}

function lose() {
  console.log('done');
}

function win() {
  console.log('win');
}
