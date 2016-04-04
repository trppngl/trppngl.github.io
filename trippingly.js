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
var currentNoteId = null;

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

// According to Julian Shapiro's book, translateY and scaleY might be better than top and height?

// And Kirupa recommends translate3d for smoothness.
// Says top (and five other properties) require a layout recalculation every step of the way. Though if the element's position is absolute (as with the highlight), that's not as bas as it would be if it was the entire thing. All that at the end of chapter 6.

function highlighter() {
  var seg = segs[currentIndex];
  var segTop = seg.offsetTop;
  var segHt = seg.clientHeight;
  var cssText = 'top: ' + segTop + 'px; height: ' + segHt + 'px;';
  highlight.style = cssText;
}

/* To animate highlight with Velocity use:

Velocity(highlight, {top: segTop, height: segHt}, {duration: 300, easing: 'ease'});

!!! As it stands, .slow in stylesheet will interfere !!!

Duration should actually be made into a variable. Either a global variable set in the two functions that call highlighter() or (probably better) as an argument that gets passed to highlighter().

But doing it with Velocity, each individual move looks good, but multiple moves (like when holding or repeatedly hitting the arrow keys) don't look as good. Could play with that.

*/

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

//

function toggleNote(targetNoteId) {
  if (currentNoteId === targetNoteId) {
    hideNote(targetNoteId);
  } else {
    showNote(targetNoteId);
    currentNoteId = targetNoteId;
  }
}

function hideNote(targetNoteId) {
  targetNote = document.getElementById(targetNoteId);
  targetNoteHt = targetNote.clientHeight;
  targetDrawer = targetNote.parentNode;
  targetDrawerHt = targetDrawer.clientHeight;
  currentFrame = 0;
  totalFrames = 30;
  changingNote = true;
  initialScrollTop = text.scrollTop;

  startValue = targetNoteHt;
  changeInValue = -targetNoteHt;

  animate();
}

function showNote(targetNoteId) {
  targetNote = document.getElementById(targetNoteId);
  targetNoteHt = targetNote.clientHeight;
  targetDrawer = targetNote.parentNode;
  targetDrawerHt = targetDrawer.clientHeight;
  currentFrame = 0;
  totalFrames = 30;
  changingNote = true;
  initialScrollTop = text.scrollTop;

  startValue = 0;
  changeInValue = targetNoteHt;

  animate();
}

function animate() {
  if (changingNote) {

    currentValue = easeOutCubic(currentFrame, startValue, changeInValue, totalFrames);
    console.log(currentValue);

    targetDrawer.style.height = currentValue + 'px';
    text.scrollTop = (initialScrollTop + currentValue);

    if (currentFrame < totalFrames) {
      currentFrame++;
    } else {
      currentFrame = 0;
      changingNote = false;
    }
    
    requestAnimationFrame(animate);
  }
}

function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
}

//

/*
function toggleNote(targetNoteId) {
  if (currentNoteId === targetNoteId) {
    showNote(null);
  } else {
    showNote(targetNoteId);
  }
}

function showNote(targetNoteId) {
  // scrollDiff = getScrollDiff(targetNoteId);
  if (currentNoteId) {
    document.getElementById(currentNoteId).parentNode.classList.add('hide'); //
  }
  if (targetNoteId) {
    document.getElementById(targetNoteId).parentNode.classList.remove('hide'); //
  }
  // text.scrollTop += scrollDiff;
  jumpHighlight();
  currentNoteId = targetNoteId;
}

function getScrollDiff(targetNoteId) {

  var targetNote = document.getElementById(targetNoteId);
  var targetNoteOrigin = targetNote ? targetNote.offsetTop : null;
  var targetNoteHt = targetNote ? targetNote.clientHeight : null;
  
  if (targetNoteHt > targetNoteOrigin) {
    return targetNoteOrigin;
  }

// Above is supposed to stop note from opening above top of window.
// "She had" to "dark suit" doesn't work.
// "had your" to "Pardon" doesn't work.
// Should it break and do 'text.scrollTop = targetNoteOrigin'?
// Or does it have to do with closing the current note and not opening the
// target note?

  var currentNote = document.getElementById(currentNoteId);
  var currentNoteOrigin = currentNote ? currentNote.offsetTop : null;
  var currentNoteHt = !currentNote | targetNoteOrigin < currentNoteOrigin ? null : currentNote.clientHeight;

  var noteHtDiff = targetNoteHt - currentNoteHt;

// When scrolled close to or at bottom of window, scrollTop needs less or no
// correction. Below accounts for that.

  var scrollBottom = text.scrollTopMax - text.scrollTop;
  if (scrollBottom + noteHtDiff < 0) {
    noteHtDiff = -scrollBottom;
  }

  return noteHtDiff;
}
*/

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
