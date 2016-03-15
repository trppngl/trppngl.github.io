var audio = document.getElementById('audio');
var highlight = document.getElementById('highlight');
var text = document.getElementById('text');
var buttons = document.getElementById('buttons');
var playButton = document.getElementById('play');

var segs = [];
segs.push.apply(segs, document.getElementsByClassName('seg'));

var length = segs.length;

var segData = [];
for (i = 0; i < length; i++) {
  segData.push({
    'start': Number(segs[i].getAttribute('data-start')),
    'stop': Number(segs[i].getAttribute('data-stop')),
    'plain': segs[i].textContent,
    'v': segs[i].getAttribute('data-v'),
    'p': segs[i].getAttribute('data-p'),
    'g': segs[i].getAttribute('data-g')
  });
}

/*
if (window.location.hash) {
  var linkMode = document.getElementById(window.location.hash.substring(1)).className;
} else {
  var linkMode = 'plain';
}
*/

var currentIndex = -1;
var playAll = 0;

var linkMode;
var currentNote;

//getLinkModeFromNote();

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

function startSeg(targetIndex) {
  if (currentIndex != targetIndex) {
    currentIndex = targetIndex;
    highlight.className = 'slow'; // Move highlight with slow transition
    highlighter();
  }
  audio.currentTime = segData[currentIndex].start;
  if (audio.paused) {
    playAudio();
  }
}

function highlighter() {
  var segBox = segs[currentIndex].getBoundingClientRect();
  var segTop = segBox.top + text.scrollTop;
  var segHt = segBox.height;
  var cssText = 'top: ' + segTop + 'px; height: ' + segHt + 'px;';
  highlight.style = cssText;
}

function playAudio() {
  audio.play();
  timer = window.setInterval(stopWatch, 100);
}

function stopWatch() {
  if (audio.currentTime > segData[currentIndex].stop) {
    if (playAll === 1 && currentIndex < length - 1) {
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

//

function toggleLinkMode(input) {
  hideCurrentNote();
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

/*
function getLinkModeFromNote() {
  console.log('checking if note showing')
  if (window.location.hash) {
    linkMode = document.getElementById(window.location.hash.substring(1)).className;
    console.log('note showing, calling writeSegs()');
    writeSegs();
  }
}
*/

//

function toggleNote(ref) {
  if (currentNote === ref) {
    hideCurrentNote();
    currentNote = null;
  } else {
    hideCurrentNote();
    currentNote = ref;
    showCurrentNote();
  }
}

function hideCurrentNote() {
  if (currentNote) {
    document.getElementById(currentNote).classList.remove('show');
  }
}

function showCurrentNote() {
  document.getElementById(currentNote).classList.add('show');
}

//

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    startSeg(Number(e.target.getAttribute('id')));
  } else if (e.target.tagName.toLowerCase() === 'span') { // Other spans?
    toggleNote(e.target.getAttribute('data-ref'));
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
    case 'vocab':
      toggleLinkMode('v');
      break;
    case 'pron':
      toggleLinkMode('p');
      break;
    case 'gram':
      toggleLinkMode('g');
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

function handleResize() {
  if (currentIndex >= 0) {
    highlight.className = ''; // On resize, move highlight without transition
    highlighter();
  }
}

//

window.addEventListener('keydown', handleKeydown, false);
window.addEventListener('resize', handleResize, false);
text.addEventListener('click', handleTextClick, false);
buttons.addEventListener('click', handleButtonClick, false);

// ???

window.addEventListener('hashchange', getLinkModeFromNote, false);
