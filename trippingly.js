var audio = document.getElementById('audio');
var highlight = document.getElementById('highlight');
var text = document.getElementById('text');
var buttons = document.getElementById('buttons');
var playButton = document.getElementById('play');

var segs = [];
segs.push.apply(segs, document.getElementsByClassName('seg'));

// Could I do the above with querySelectorAll? The goal of pushing to an array is to make sure it isn't live, but apparently with querySelectorAll, it wouldn't be.

var length = segs.length;

var segData = [];
for (i = 0; i < length; i++) {
  var seg = segs[i];
  var times = seg.getAttribute('data-times').split(' ');
  segData.push({
    'start': Number(times[0]),
    'stop': Number(times[1]),
    'plain': seg.textContent,
    'v': seg.getAttribute('data-v'),
    'p': seg.getAttribute('data-p'),
    'g': seg.getAttribute('data-g')
  });
}

// Maybe an associative array of all the notes

var currentIndex = -1;
var playAll = 0;

var linkMode = 'plain';

//

function prev() {
  var threshold = segData[currentIndex].start + 0.5; // Was 0.2 but 300ms gap
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

function startSeg(targetIndex, auto) { // Inelegant?
  if (currentIndex != targetIndex) {
    currentIndex = targetIndex;
    highlight.className = 'slow'; // Move highlight with slow transition
    highlighter();
  }
  if (auto !== 1) { // Inelegant?
    console.log('auto !== true');
    audio.currentTime = segData[currentIndex].start;
  } else {
    console.log('else');
  }
  if (audio.paused) {
    playAudio();
  }
}

function highlighter() {
  var seg = segs[currentIndex];
  var segTop = seg.offsetTop; // An expensive operation? Better way?
  var segHt = seg.clientHeight;
  var cssText = 'top: ' + segTop + 'px; height: ' + segHt + 'px;';
  highlight.style = cssText;
}

function playAudio() {
  audio.play();
  timer = window.setInterval(checkStop, 20);
}

function checkStop() {
  if (audio.currentTime > segData[currentIndex].stop && playAll === 0) {
    pauseAudio();
  }
  if (audio.currentTime > segData[currentIndex + 1].start && playAll === 1 && currentIndex < length - 1) {
    startSeg(currentIndex + 1, 1); // next();
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

// Links

function toggleLinkMode(input) {
  if (linkMode === input) {
    linkMode = 'plain';
  } else {
    linkMode = input;
  }
  writeSegs();
}

function writeSegs() {
  for (i = 0; i < length; i++) {
    if (segData[i][linkMode]) {
      segs[i].innerHTML = segData[i][linkMode];
    } else {
      segs[i].innerHTML = segData[i]['plain'];
    }
  }
}

//

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    startSeg(Number(e.target.getAttribute('id')));
  // Here I used to have an else if for links
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
    case 86:
      toggleLinkMode('v');
      break;
    case 80:
      toggleLinkMode('p');
      break;
    case 71:
      toggleLinkMode('g');
      break;
  }
}

function jumpHighlight() {
  if (currentIndex >= 0) {
    highlight.className = '';
    highlighter();
  }
}

//

// Debounce resize handler?

window.addEventListener('keydown', handleKeydown, false);
window.addEventListener('resize', jumpHighlight, false);
// window.addEventListener('hashchange', hashNote, false);

text.addEventListener('click', handleTextClick, false);
buttons.addEventListener('click', handleButtonClick, false);
