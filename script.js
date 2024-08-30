let countDownDate = new Date(
  Date.UTC(new Date().getFullYear(), 8, 3, 13, 45, 0)
).getTime();

let x = setInterval(function () {
  let now = new Date().getTime();

  let distance = countDownDate - now;

  let days = Math.floor(distance / (1000 * 60 * 60 * 24));
  let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("timer").innerHTML =
    days +
    "d " +
    ("0" + hours).slice(-2) +
    "h " +
    ("0" + minutes).slice(-2) +
    "m " +
    ("0" + seconds).slice(-2) +
    "s ";

  if (distance < 0) {
    clearInterval(x);
    document.getElementById("timer").innerHTML = "oh no...";
  }
}, 1000);
