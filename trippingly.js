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

var currentNote = new Note();
var targetNote = new Note();

// hashNote();

var currentFrame = 0;
var totalFrames = 30;
var animating = false;
var scrolling = false;

var initialScrollTop;

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
  timer = window.setInterval(stopWatch, 20);
}

function stopWatch() {
  if (audio.currentTime > segData[currentIndex].stop) {
    if (playAll === 1 && currentIndex < length - 1) {
      startSeg(currentIndex + 1, 1); // next();
    } else {
      console.log(audio.currentTime);
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

// Links

function toggleLinkMode(input) {
  // showNote(null);
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

// Notes

function toggleNote(targetNoteId) {
  if (targetNoteId === currentNote.id) { // Improve
    showNote(null);
  } else {
    showNote(targetNoteId);
  }
}

function Note(id) {
  if (id) {
    var el = document.getElementById(id);
    this.id = id;
    this.height = el.clientHeight;
    this.drawer = el.parentNode;
  } else {
    this.id = null;
  }
}

function showNote(targetNoteId) {
  if (targetNoteId) {
    targetNote = new Note(targetNoteId);
  }
  initialScrollTop = text.scrollTop;
  animating = true;
  scrolling = true;
  animate();
}

function animate() {
  if (animating) {

    if (currentNote.id) {
      currentNoteXYZ = Math.round(easeOutCubic(currentFrame, currentNote.height, -currentNote.height, totalFrames));
      scrollOffset = -targetNoteXYZ;
      currentNote.drawer.style.height = currentNoteXYZ + 'px';
      // if (currentNoteHigher)
      // currentNoteDiff
    }

    if (targetNote.id) {
      targetNoteXYZ = Math.round(easeOutCubic(currentFrame, 0, targetNote.height, totalFrames));
      scrollOffset = targetNoteXYZ;
      targetNote.drawer.style.height = targetNoteXYZ + 'px';
    }

    text.scrollTop = initialScrollTop + scrollOffset;
    // if (scrolling) {
      // currentNoteDiff only if currentNote is above targetNote 
    // }

    if (currentFrame < totalFrames) {
      currentFrame++;
    } else {
      finishAnimation();
    }
    
    requestAnimationFrame(animate);
  }
}

function finishAnimation() {
  currentFrame = 0;
  animating = false;
  scrolling = false;
  currentNote = targetNote;
  targetNote = new Note();
}

function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
}

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

// Debounce resize handler?

window.addEventListener('keydown', handleKeydown, false);
window.addEventListener('resize', jumpHighlight, false);
// window.addEventListener('hashchange', hashNote, false);

text.addEventListener('click', handleTextClick, false);
buttons.addEventListener('click', handleButtonClick, false);
