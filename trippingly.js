var audio = document.getElementById('audio');
var highlight = document.getElementById('highlight');
var text = document.getElementById('text');

var segs = [];
segs.push.apply(segs, document.getElementsByClassName('seg'));

// Could I do the above with querySelectorAll? The goal of pushing to an array is to make sure it isn't live, but apparently with querySelectorAll, it wouldn't be.

var numSegs = segs.length;

var segData = [];
for (i = 0; i < numSegs; i++) {
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

var easingMultipliers = [0, 0.03833, 0.11263, 0.22067, 0.34604, 0.46823, 0.57586, 0.66640, 0.74116, 0.80240, 0.85228, 0.89260, 0.92482, 0.95011, 0.96941, 0.98347, 0.99293, 0.99830, 1]

var totalFrames = easingMultipliers.length - 1;
var currentFrame = 0;

var startTop = 0;
var startHt = 0;
var startScroll = 0;
var endTop = 0;
var endHt = 0;
var endScroll = 0;

var currentIndex = -1;

var currentNote = null;

var playAll = false;
var userStartSeg = false;

var movingHighlight = false;
var scrolling = false;

var linkMode = 'plain';

//

// 300ms gap on phones, so could change 0.2 to 0.5 or find some way to eliminate that gap

function prev() {
  var threshold = segData[currentIndex].start + 0.2;
  if (threshold < audio.currentTime) {
    userStartSeg = true;
    startSeg(currentIndex);
  } else if (currentIndex > 0) {
    userStartSeg = true;
    startSeg(currentIndex - 1);
  }
}

function next() {
  if (currentIndex < numSegs - 1) {
    userStartSeg = true;
    startSeg(currentIndex + 1);
  }
}

//

function startSeg(targetIndex) {
  currentFrame = 1;
  currentIndex = targetIndex;
  prepMoveHighlight();
  prepScroll();
  movingHighlight = true;
  if (userStartSeg) {
    audio.currentTime = segData[currentIndex].start;
    if (audio.paused) {
      playAudio();
    }
  }
}

function prepMoveHighlight() {
  var seg = segs[currentIndex];
  endTop = seg.offsetTop;
  endHt = seg.clientHeight;
  startTop = highlight.offsetTop;
  startHt = highlight.clientHeight;
}

function prepScroll() {
  startScroll = window.pageYOffset;
  var windowHt = window.innerHeight;
  var prevSegOffset = 0;
  var nextSegOffset = 0;

  // Don't autoscroll if user has scrolled highlight off-screen
  // Should it be < and > or <== and >==?

  if (userStartSeg || (startTop < startScroll + windowHt && startTop + startHt > startScroll)) {

    if (segs[currentIndex - 1]) {
      prevSegOffset = segs[currentIndex - 1].offsetTop - startScroll;
    } else { // currentIndex must be 0, so scroll to top
      endScroll = 0;
      scrolling = true;
    }

    if (segs[currentIndex + 1]) {
      nextSegOffset = segs[currentIndex + 1].offsetTop + segs[currentIndex + 1].clientHeight - windowHt - startScroll;
    } else { // currentIndex must be last, so scroll to bottom
      endScroll = segs[currentIndex].offsetTop + segs[currentIndex].clientHeight - windowHt;
      scrolling = true;
    }

    if (nextSegOffset > 0) {
      endScroll = startScroll + nextSegOffset;
      scrolling = true;
    } else if (prevSegOffset < 0) {
      endScroll = startScroll + prevSegOffset;
      scrolling = true;
    }
  }
}

function animate() {
  if (movingHighlight) {
    currentTop = Math.round(ease(startTop, endTop));
    currentHt = Math.round(ease(startHt, endHt));
    var cssText = 'top: ' + currentTop + 'px; height: ' + currentHt + 'px;';
    highlight.style = cssText;
  }

  if (scrolling) {
    currentScroll = Math.round(ease(startScroll, endScroll));
    window.scrollTo(0, currentScroll);
  }

  if (movingHighlight || scrolling) {
    if (currentFrame < totalFrames) {
      currentFrame += 1;
    } else {
      movingHighlight = false;
      scrolling = false;
    }
  }

  requestAnimationFrame(animate);
}

function ease(startValue, endValue) {
  return (endValue - startValue) * easingMultipliers[currentFrame] + startValue;
}

//

function playAudio() {
  audio.play();
  audioTimer = window.setInterval(checkStop, 20);
}

// Make it so at the end of the recording, playAll changes to false?
function checkStop() {
  if (audio.currentTime > segData[currentIndex].stop && !playAll) {
    pauseAudio();
  }
  if (audio.currentTime > segData[currentIndex + 1].start && playAll && currentIndex < numSegs - 1) {
    userStartSeg = false;
    startSeg(currentIndex + 1);
  }
}

function pauseAudio() {
  audio.pause();
  window.clearInterval(audioTimer);
}

function togglePlayAll() {
  if (audio.paused) {
    playAll = true;
    next();
  } else {
    playAll = !playAll;
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
  hideCurrentNote();
  currentNote = null;
}

function writeSegs() {
  for (i = 0; i < numSegs; i++) {
    if (segData[i][linkMode]) {
      segs[i].innerHTML = segData[i][linkMode];
    } else {
      segs[i].innerHTML = segData[i]['plain'];
    }
  }
}

// Notes

// toggleLinkMode() should close any open notes. It could call a function closeNote() that could also be called from here.

function toggleNote(targetNote) {
  hideCurrentNote();
  if (currentNote === targetNote) {
    currentNote = null;
  } else {
    currentNote = targetNote;
    currentNote.style = 'display: block';
  }
}

function hideCurrentNote() {
  if (currentNote) {
    currentNote.style = 'display: none';
  }
}

// Event handlers

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    userStartSeg = true;
    startSeg(Number(e.target.getAttribute('id')));
  } else if (e.target.tagName.toLowerCase() === 'span') { // Other text spans?
    toggleNote(document.getElementById(e.target.getAttribute('data-note')));
    // Too much in above line?
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

// Event listeners

// Debounce resize handler? (Old note, and I've forgotten what it means.)

window.addEventListener('keydown', handleKeydown, false);
// window.addEventListener('resize', jumpHighlight, false);
// window.addEventListener('hashchange', hashNote, false);

text.addEventListener('click', handleTextClick, false);

//

requestAnimationFrame(animate);
