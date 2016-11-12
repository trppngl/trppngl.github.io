var audio = document.getElementById('audio');
var highlight = document.getElementById('highlight');
var text = document.getElementById('text');

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

var currentFrame = 0;
var totalFrames = 18;

var startTop = 0;
var startHt = 0;
var endTop = 0;
var endHt = 0;

var animating = false;

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

//

function startSeg(targetIndex, auto) {
  if (currentIndex != targetIndex) {
    currentIndex = targetIndex;
    startAnimateHighlight();
  }
  if (auto !== 1) {
    audio.currentTime = segData[currentIndex].start;
    if (audio.paused) {
      playAudio();
    }
  }
}

function startAnimateHighlight() {
  currentFrame = 1;
  var seg = segs[currentIndex];
  endTop = seg.offsetTop;
  endHt = seg.clientHeight;
  startTop = highlight.offsetTop;
  startHt = highlight.clientHeight;
  console.log('move highlight to seg ' + currentIndex);
  console.log('change top from ' + startTop + ' to ' + endTop);
  console.log('change height from ' + startHt + ' to ' + endHt);
  animating = true;
}

function animateHighlight() {
  if (animating) {
    console.log('animating');
    currentTop = Math.round(easeOutCubic(startTop, endTop - startTop, currentFrame, totalFrames));
    currentHt = Math.round(easeOutCubic(startHt, endHt - startHt, currentFrame, totalFrames));
    var cssText = 'top: ' + currentTop + 'px; height: ' + currentHt + 'px;';
    highlight.style = cssText;
    if (currentFrame < 18) {
      currentFrame += 1;
    } else {
      animating = false;
    }
  }
  requestAnimationFrame(animateHighlight);
}

function easeOutCubic(startValue, changeInValue, currentFrame, totalFrames) {
  return changeInValue * (Math.pow(currentFrame / totalFrames - 1, 3) + 1) + startValue;
}

//

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

//

requestAnimationFrame(animateHighlight);
