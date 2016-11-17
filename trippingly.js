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

var playAll = false;
var autoStartSeg = false;

var movingHighlight = false;
var scrolling = false;

var linkMode = 'plain';

//

function prev() {
  var threshold = segData[currentIndex].start + 0.2; // 300ms gap on phones, so could change to 0.5 or find some way to eliminate that gap
  if (threshold < audio.currentTime) {
    autoStartSeg = false;
    startSeg(currentIndex);
  } else if (currentIndex > 0) {
    autoStartSeg = false;
    startSeg(currentIndex - 1);
  }
}

function next() {
  if (currentIndex < numSegs - 1) {
    autoStartSeg = false;
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
  if (!autoStartSeg) {
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

  console.log('move highlight to seg ' + currentIndex);
  console.log('change top from ' + startTop + ' to ' + endTop);
  console.log('change height from ' + startHt + ' to ' + endHt);
}

function prepScroll() {
  startScroll = window.pageYOffset;
  var windowHt = window.innerHeight;
  var prevSegOffset = 0;
  var nextSegOffset = 0;

  if (segs[currentIndex - 1]) {
    prevSegOffset = segs[currentIndex - 1].offsetTop - startScroll;
  } else { // currentIndex must be 0, so...
    endScroll = 0;
    scrolling = true;
  }

  if (segs[currentIndex + 1]) {
    nextSegOffset = segs[currentIndex + 1].offsetTop + segs[currentIndex + 1].clientHeight - windowHt - startScroll;
  } else { // currentIndex must be last, so...
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

function animate() {
  if (movingHighlight) {
    console.log('movingHighlight frame ' + currentFrame);
    currentTop = Math.round(ease(startTop, endTop));
    currentHt = Math.round(ease(startHt, endHt));
    var cssText = 'top: ' + currentTop + 'px; height: ' + currentHt + 'px;';
    highlight.style = cssText;
  }

  if (scrolling) {
    console.log('scrolling frame ' + currentFrame);
    currentScroll = Math.round(ease(startScroll, endScroll));
    console.log(currentScroll);
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
  timer = window.setInterval(checkStop, 20);
}

function checkStop() {
  if (audio.currentTime > segData[currentIndex].stop && !playAll) {
    pauseAudio();
  }
  if (audio.currentTime > segData[currentIndex + 1].start && playAll && currentIndex < numSegs - 1) {
    autoStartSeg = true;
    startSeg(currentIndex + 1);
  }
}

function pauseAudio() {
  audio.pause();
  window.clearInterval(timer);
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

//

function handleTextClick(e) {
  if (e.target.classList.contains('seg')) {
    autoStartSeg = false;
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
    highlighter(); // Need to update this.
  }
}

//

// Debounce resize handler? (Old note, and I've forgotten what it means.)

window.addEventListener('keydown', handleKeydown, false);
window.addEventListener('resize', jumpHighlight, false);
// window.addEventListener('hashchange', hashNote, false);

text.addEventListener('click', handleTextClick, false);

//

requestAnimationFrame(animate);
