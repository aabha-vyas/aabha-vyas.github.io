// ASCII ocean with a swimmer. Click anywhere to make a splash; the swimmer heads toward it.
(function () {
  var canvas = document.getElementById('ocean');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var FONT_SIZE = 15;
  var CELL_H = 20;
  var cellW = 9;
  var width = 0, height = 0, cols = 0, rows = 0, dpr = 1;
  var field = new Float32Array(0);
  var colors = {};

  // Characters from calm water (index 1) up to wave crests (index 5)
  var RAMP = [' ', '.', ',', ':', '-', '~'];
  var ALPHA = [0, 0.26, 0.38, 0.5, 0.66, 0.92];

  var ripples = [];
  var swimmer = { x: 0, y: 0, tx: 0, ty: 0, face: 1, phase: 0, wake: 0 };

  // Right-facing frames. Head 'O' sits at column HEAD_COL. Mirrored when swimming left.
  var HEAD_COL = 5;
  var FRAMES = [
    ['      /-', ':====O ', '  \\    '],
    ['     _  ', ':====O ', '   \\   '],
    ['  /     ', ':====O ', '      \\-'],
    ['   /    ', ':====O ', '     _  ']
  ];

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    colors = {
      bg: s.getPropertyValue('--bg').trim(),
      bg2: s.getPropertyValue('--bg2').trim(),
      deep: s.getPropertyValue('--wave-deep').trim(),
      wave: s.getPropertyValue('--wave').trim(),
      crest: s.getPropertyValue('--crest').trim(),
      swimmer: s.getPropertyValue('--swimmer').trim()
    };
  }

  function bgFill() {
    var g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, colors.bg);
    g.addColorStop(1, colors.bg2);
    return g;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT_SIZE + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'top';
    cellW = ctx.measureText('M').width || 9;
    cols = Math.ceil(width / cellW) + 1;
    rows = Math.ceil(height / CELL_H) + 1;
    field = new Float32Array(cols * rows);
    if (!swimmer.x) { swimmer.x = width * 0.3; swimmer.y = height * 0.28; pickTarget(); }
  }

  function pickTarget() {
    swimmer.tx = width * (0.08 + Math.random() * 0.84);
    swimmer.ty = height * (0.12 + Math.random() * 0.42);
  }

  function addRipple(x, y, amp, now) {
    ripples.push({ x: x, y: y, t0: now, amp: amp });
    if (ripples.length > 14) ripples.shift();
  }

  function computeField(t) {
    var i = 0;
    for (var r = 0; r < rows; r++) {
      var py = r * CELL_H + CELL_H / 2;
      for (var c = 0; c < cols; c++, i++) {
        var px = c * cellW + cellW / 2;
        var h = 0.45 * Math.sin(c * 0.10 + r * 0.62 - t * 1.0) +
                0.3 * Math.sin(c * 0.045 - r * 0.41 - t * 0.65) +
                0.22 * Math.sin(c * 0.17 + r * 0.95 + t * 1.45);
        for (var k = 0; k < ripples.length; k++) {
          var rp = ripples[k];
          var age = t - rp.t0;
          if (age < 0 || age > 4) continue;
          var dx = (px - rp.x) / cellW;
          var dy = (py - rp.y) / cellW;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var front = age * 15;
          var d = dist - front;
          h += rp.amp * Math.exp(-age * 0.7) * Math.sin(d * 1.6) * Math.exp(-(d * d) / 14);
        }
        field[i] = h;
      }
    }
  }

  function drawWater() {
    ctx.fillStyle = bgFill();
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, height);
    for (var level = 1; level <= 5; level++) {
      ctx.globalAlpha = ALPHA[level];
      ctx.fillStyle = level === 5 ? colors.crest : (level >= 3 ? colors.wave : colors.deep);
      var ch = RAMP[level];
      var i = 0;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++, i++) {
          var v = (field[i] + 1) / 2;
          var idx = v < 0 ? 0 : Math.min(5, Math.floor(v * 6));
          if (idx === level) ctx.fillText(ch, c * cellW, r * CELL_H);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawSwimmer() {
    var frame = FRAMES[Math.floor(swimmer.phase) % FRAMES.length];
    var headX = Math.round(swimmer.x / cellW) * cellW;
    var headY = Math.round(swimmer.y / CELL_H) * CELL_H;
    for (var row = 0; row < 3; row++) {
      var line = frame[row];
      for (var col = 0; col < line.length; col++) {
        var chr = line[col];
        if (chr === ' ') continue;
        if (swimmer.face < 0) {
          if (chr === '/') chr = '\\'; else if (chr === '\\') chr = '/';
        }
        var x = headX + (col - HEAD_COL) * swimmer.face * cellW;
        var y = headY + (row - 1) * CELL_H;
        ctx.fillStyle = bgFill();
        ctx.fillRect(x, y, cellW, CELL_H);
        ctx.fillStyle = colors.swimmer;
        ctx.font = (chr === 'O' ? 'bold ' : '') + FONT_SIZE + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
        ctx.fillText(chr, x, y);
      }
    }
    ctx.font = FONT_SIZE + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
  }

  function moveSwimmer(dt, t) {
    var dx = swimmer.tx - swimmer.x;
    var dy = swimmer.ty - swimmer.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) { pickTarget(); return; }
    var speed = 85; // pixels per second
    var step = Math.min(dist, speed * dt);
    swimmer.x += (dx / dist) * step;
    swimmer.y += (dy / dist) * step;
    if (Math.abs(dx) > 6) swimmer.face = dx > 0 ? 1 : -1;
    swimmer.phase += step / (cellW * 1.3);
    swimmer.wake += dt;
    if (swimmer.wake > 0.3) {
      swimmer.wake = 0;
      addRipple(swimmer.x - swimmer.face * cellW * 3, swimmer.y, 0.28, t);
    }
  }

  function render(t) {
    computeField(t);
    drawWater();
    drawSwimmer();
  }

  var start = performance.now();
  var last = start;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 33) return; // about 30 frames per second
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    var t = (now - start) / 1000;
    moveSwimmer(dt, t);
    ripples = ripples.filter(function (rp) { return t - rp.t0 < 4; });
    render(t);
  }

  window.addEventListener('click', function (e) {
    if (reduceMotion) return;
    if (e.target.closest && e.target.closest('a, nav, button')) return;
    var t = (performance.now() - start) / 1000;
    addRipple(e.clientX, e.clientY, 1.1, t);
    swimmer.tx = e.clientX;
    swimmer.ty = e.clientY;
  });

  window.addEventListener('resize', function () { resize(); if (reduceMotion) render(0); });
  window.addEventListener('themechange', function () { readColors(); if (reduceMotion) render(0); });

  readColors();
  resize();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { resize(); if (reduceMotion) render(0); });
  }
  if (reduceMotion) { render(0); } else { requestAnimationFrame(frame); }
})();
