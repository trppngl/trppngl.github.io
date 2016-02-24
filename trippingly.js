var audio = document.getElementById('audio');
var text = document.getElementById('text');
var buttons = document.getElementById('buttons');
var playButton = document.getElementById('play');

var segs = [];
segs.push.apply(segs, document.getElementsByClassName('seg'));

var length = segs.length;

var times = [];
for (i = 0; i < length; i++) {
  var start = Number(segs[i].getAttribute('data-start'));
  var stop = Number(segs[i].getAttribute('data-stop'));
  times.push({
    'start': start,
    'stop': stop
  });
}

var currentIndex = -1;
var playAll = 0;

//

function prev() {
  var threshold = times[currentIndex].start + 0.2;
  if (audio.currentTime > threshold) {
    startSeg(currentIndex);
  } else if (currentIndex > 0) {
    startSeg(currentIndex - 1);
  }
}

function next() {
  if (currentIndex < length - 1) {
    startSeg(currentIndex + 1);
  }
}

function startSeg(targetIndex) {
  if (currentIndex != targetIndex) {
    changeSeg(targetIndex);
  }
  audio.currentTime = times[currentIndex].start;
  if (audio.paused) {
    playAudio();
  }
}

function changeSeg(targetIndex) {
  if (currentIndex >= 0) {
    segs[currentIndex].classList.remove('current');
  }
  currentIndex = targetIndex;
  segs[currentIndex].classList.add('current');
  scroll();
}

function playAudio() {
  audio.play();
  timer = window.setInterval(stopWatch, 100);
}

function stopWatch() {
  if (audio.currentTime > times[currentIndex].stop) {
    if (playAll === 1 && currentIndex < length - 1) { // repeated in next()
      next();
    } else {
      pauseAudio();
    }
  }
}

function pauseAudio() {
  audio.pause();
  window.clearInterval(timer);
}

function togglePlayAll() {
  if (audio.paused) {
    playAll = 1;
    next();
  } else {
    playAll ^= 1;
  }
  togglePlayButton();
}

function togglePlayButton() {
  if (playAll === 0) {
    playButton.textContent = 'Play';
  } else {
    playButton.textContent = 'Pause';
  }
}

// DRY and 

function scroll() {
  var segBox = segs[currentIndex].getBoundingClientRect();
  var segTop = segBox.top;
  var segBottom = segBox.bottom;
  var viewBottom = text.getBoundingClientRect().bottom; // or .height? same?
  var scrollChange = 0;
  if (segTop < 0) {
    scrollChange = segTop;
  } else if (segBottom > viewBottom) {
    scrollChange = segBottom - viewBottom;
  }
  text.scrollTop += scrollChange;
}

//

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    startSeg(Number(e.target.getAttribute('id')));
  }
}

function handleButtonClick(e) {
  switch(e.target.getAttribute('id')) {
    case 'next':
      next();
      break;
    case 'prev':
      prev();
      break;
    case 'play':
      togglePlayAll();
      break;
  }
}

function handleKeydown(e) {
  switch(e.keyCode) {
    case 37:
      prev();
      break;
    case 39:
      next();
      break;
    case 32:
      e.preventDefault(); // So browser doesn't jump to bottom
      togglePlayAll();
      break;
  }
}

//

window.addEventListener('keydown', handleKeydown, false);
text.addEventListener('click', handleTextClick, false);
buttons.addEventListener('click', handleButtonClick, false);
