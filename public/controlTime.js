let times = document.querySelectorAll('.time');
let dates = [];

times.forEach(function(val, i) {
  let start = val.innerHTML;
  let date = new Date(Date.now() - start);
  console.log(date);
  dates.push([val, date, start]);
  display(dates[i]);
  val.style.display = 'inline-block';
});

setInterval(() => {
  dates.map((item) => {
    item[1] = new Date(Date.now() - item[2]);
    display(item);
  })
}, 1000);

function display(data) {
  let val = data[0];
  let date = data[1];

  let hours = date.getMonth() * 31 * 24 +
    date.getDate() * 24 - 24 +
    date.getHours() - 2;
  let mins = date.getMinutes();
  let seconds = date.getSeconds();

  let result = '';

  if (hours !== 0) {
    result += hours + ':';
  }

  if (mins === 0) {
    if (hours !== 0) result += mins + ':'
  } else {
    result += mins + ':'
  }

  result += seconds;
  val.innerHTML = result;
}
