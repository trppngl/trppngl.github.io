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

var easingMultipliers = {
  // (.25,.1,.25,1) CSS transition ease (default)
  default: [0.00000, 0.03833, 0.11263, 0.22067, 0.34604, 0.46823, 0.57586, 0.66640, 0.74116, 0.80240, 0.85228, 0.89260, 0.92482, 0.95011, 0.96941, 0.98347, 0.99293, 0.99830, 1.00000],
  // (.42,0,.58,1) CSS transition easeInOut
  easeInOut: [0.00000, 0.00598, 0.02445, 0.05613, 0.10142, 0.16023, 0.23177, 0.31429, 0.40496, 0.50000, 0.59504, 0.68571, 0.76823, 0.83977, 0.89858, 0.94387, 0.97555, 0.99402, 1.00000]
};

var totalFrames = 18;
var currentFrame = 0;

var startTop = 0;
var startHt = 0;
var startScroll = 0;
var endTop = 0;
var endHt = 0;
var endScroll = 0;

var currentIndex = -1;

var currentLink = null;
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
  if (audio.currentTime > threshold) {
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
  var prevSegOffset = 0;
  var nextSegOffset = 0;
  var windowHt = window.innerHeight;
  startScroll = window.pageYOffset;

  // Only consider scrolling if segment change initiated by user or if some part of highlight will be in view at some point during change. Allows user to scroll away from autoscrolling highlight without being yanked back.

  if (userStartSeg || (endTop + endHt > startScroll && startTop < startScroll + windowHt)) {

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

function ease(startValue, endValue) { // Break into two functions?
  var easingFunction;
  if (userStartSeg) {
    easingFunction = 'default';
  } else {
    easingFunction = 'easeInOut';
  }
  console.log(easingFunction);
  return (endValue - startValue) * easingMultipliers[easingFunction][currentFrame] + startValue;
}

//

function playAudio() {
  audio.play();
  audioTimer = window.setInterval(checkStop, 20);
}

function checkStop() {
  if (audio.currentTime > segData[currentIndex].stop && (!playAll || currentIndex === numSegs - 1)) {
    pauseAudio();
    playAll = false;
  } else if (audio.currentTime > segData[currentIndex + 1].start) {
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
    showCurrentNote();
  }
}

function hideCurrentNote() {
  if (currentNote) {
    currentNote.style = 'display: none';
  }
}

function showCurrentNote() {
  currentNote.style = 'display: block';
}
// Event handlers

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    userStartSeg = true;
    startSeg(Number(e.target.getAttribute('id')));
  } else if (e.target.tagName.toLowerCase() === 'span') { // Other text spans?
    currentLink = e.target;
    toggleNote(document.getElementById(currentLink.getAttribute('data-note')));
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
