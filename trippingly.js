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

// Maybe an associative array of all the notes

var currentIndex = -1;
var playAll = 0;

var linkMode = 'plain';
var currentNote = null;

// hashNote();

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
  var seg = segs[currentIndex];
  var segTop = seg.offsetTop;
  var segHt = seg.clientHeight;
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
  showNote(null);
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

function toggleNote(targetNote) {
  if (currentNote === targetNote) {
    showNote(null);
  } else {
    showNote(targetNote);
  }
}

function showNote(targetNote) {
  scrollDiff = getScrollDiff(targetNote);
  if (currentNote) {
    document.getElementById(currentNote).parentNode.classList.add('hide'); //
  }
  if (targetNote) {
    document.getElementById(targetNote).parentNode.classList.remove('hide'); //
  }
  text.scrollTop += scrollDiff;
  jumpHighlight();
  currentNote = targetNote;
}

// Not working on Chrome on phone.

function getScrollDiff(targetNote) {
  if (targetNote) {
    var targetNoteBox = document.getElementById(targetNote).getBoundingClientRect();
    var targetNoteOrigin = targetNoteBox.top;
    var targetNoteHt = targetNoteBox.height;
    if (targetNoteHt > targetNoteOrigin) {
      return targetNoteOrigin;
    }

    // Above stops note from opening above top of window.
    // "She had" to "dark suit" doesn't work.
    // "had your" to "Pardon" doesn't work.

  } else {
    var targetNoteOrigin = null;
    var targetNoteHt = null;
  }
  if (currentNote) {
    var currentNoteBox = document.getElementById(currentNote).getBoundingClientRect();
    var currentNoteOrigin = currentNoteBox.top;
    if (targetNoteOrigin && targetNoteOrigin < currentNoteOrigin) {

    // If current note is below target note, it shouldn't enter into the calculations, so it's set to zero.

      var currentNoteHt = null;
    } else {
      var currentNoteHt = currentNoteBox.height;
    }
  } else {
    var currentNoteHt = null;
  }
  noteHtDiff = targetNoteHt - currentNoteHt;

  // When scrolled close to or at bottom of window, scrollTop needs less or no correction. This accounts for that.

  scrollBottom = text.scrollTopMax - text.scrollTop;
  if (scrollBottom + noteHtDiff < 0) {
    noteHtDiff = -scrollBottom;
  }

  return noteHtDiff;
}

// Closing note when scrolled to bottom of window jumps up.

//

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    startSeg(Number(e.target.getAttribute('id')));
  } else if (e.target.tagName.toLowerCase() === 'span') { // Other spans?
    toggleNote(e.target.getAttribute('data-note'));
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

function jumpHighlight() {
  if (currentIndex >= 0) {
    highlight.className = '';
    highlighter();
  }
}

//

window.addEventListener('keydown', handleKeydown, false);
window.addEventListener('resize', jumpHighlight, false);
// window.addEventListener('hashchange', hashNote, false);

text.addEventListener('click', handleTextClick, false);
buttons.addEventListener('click', handleButtonClick, false);
