var CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Draw times in the visitor's own time zone.
document.querySelectorAll('time[data-ts]').forEach(function (el) {
  var d = new Date(el.dataset.ts * 1000);
  el.textContent = d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  el.title = d.toUTCString();
});

// Live countdowns.
(function () {
  var els = [].slice.call(document.querySelectorAll('.countdown[data-ts]'));
  if (!els.length) return;
  var p = function (n) { return (n < 10 ? '0' : '') + n; };
  function tick() {
    var now = Date.now() / 1000;
    els.forEach(function (el) {
      var s = Math.max(0, Math.floor(el.dataset.ts - now)), d = Math.floor(s / 86400);
      el.textContent = (d ? d + 'd ' : '') + p(Math.floor(s % 86400 / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
      el.classList.toggle('soon', s < 3600 * 6);
    });
  }
  tick(); setInterval(tick, 1000);
})();

// Cards lean toward the pointer and light up under it.
document.querySelectorAll('.tilt').forEach(function (c) {
  if (CALM) return;
  c.addEventListener('pointermove', function (e) {
    var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    c.style.transform = 'perspective(700px) rotateX(' + (0.5 - y) * 10 + 'deg) rotateY(' + (x - 0.5) * 12 + 'deg) translateY(-4px)';
  });
  c.addEventListener('pointerleave', function () { c.style.transform = ''; });
});

// Confetti burst at a point on screen.
var confetti = (function () {
  var cv = document.getElementById('fx'), parts = [], running = false, colors = ['#ff4fd8', '#7a5cff', '#3fe8ff', '#c6ff3d', '#ffc93d', '#ff8a3d'];
  if (!cv || CALM) return function () {};
  var ctx = cv.getContext('2d');
  function size() { cv.width = innerWidth; cv.height = innerHeight; }
  addEventListener('resize', size); size();
  function frame() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(function (q) { return q.life > 0; });
    parts.forEach(function (q) {
      q.vy += 0.25; q.x += q.vx; q.y += q.vy; q.rot += q.vr; q.life--;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.globalAlpha = Math.min(1, q.life / 20); ctx.fillStyle = q.c;
      if (q.round) { ctx.beginPath(); ctx.arc(0, 0, q.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2);
      ctx.restore();
    });
    if (parts.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, cv.width, cv.height); }
  }
  return function (x, y, n) {
    for (var i = 0; i < (n || 40); i++) {
      var a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7;
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: 5 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 50 + Math.random() * 30, c: colors[i % colors.length], round: i % 3 === 0 });
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  };
})();
// A little celebration when something succeeds (order placed, added to cart).
var okFlash = document.querySelector('.flash.ok');
if (okFlash) { var fr = okFlash.getBoundingClientRect(); confetti(fr.left + fr.width / 2, fr.top + 20, 70); }

// Number picker.
(function () {
  var f = document.getElementById('picker');
  if (!f) return;
  var c = f.dataset, MN = +c.mainN, MM = +c.mainMax, BN = +c.bonusN, BM = +c.bonusMax, lines = [], box = document.getElementById('lines'), last = null;
  var usd = function (cents) { return '$' + (cents / 100).toFixed(2); };
  var complete = function (l) { return l.main.length === MN && l.bonus.length === BN; };
  function pick(n, max) { var s = []; while (s.length < n) { var x = 1 + crypto.getRandomValues(new Uint32Array(1))[0] % max; if (s.indexOf(x) < 0) s.push(x); } return s; }
  function burst(el) { var r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 30, 45); }
  function grid(l, idx, key, n, max) {
    var g = document.createElement('div'); g.className = 'nums' + (key === 'bonus' ? ' bonus' : '');
    for (var i = 1; i <= max; i++) (function (i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = i;
      var on = l[key].indexOf(i) >= 0; b.className = (on ? 'on' : '') + (last === idx + key + i ? ' pop' : ''); b.setAttribute('aria-pressed', on);
      b.onclick = function () {
        var was = complete(l), at = l[key].indexOf(i);
        if (at >= 0) l[key].splice(at, 1); else if (l[key].length < n) { l[key].push(i); last = idx + key + i; } else return;
        draw(); last = null;
        if (!was && complete(l)) burst(box.children[idx]);
      };
      g.appendChild(b);
    })(i);
    return g;
  }
  // Quick pick tumbles through a few random sets before it settles.
  function quick(l, idx) {
    var spins = CALM ? 0 : 7, t = 0;
    (function spin() {
      l.main = pick(MN, MM); l.bonus = BN ? pick(BN, BM) : []; draw();
      if (t++ < spins) setTimeout(spin, 60 + t * 12); else burst(box.children[idx]);
    })();
  }
  function draw() {
    box.innerHTML = '';
    lines.forEach(function (l, idx) {
      var el = document.createElement('div'); el.className = 'line' + (complete(l) ? ' done' : '');
      var h = document.createElement('header');
      h.innerHTML = '<div>Line ' + (idx + 1) + ' <span class="meta">' + l.main.length + '/' + MN + (BN ? ' + ' + l.bonus.length + '/' + BN : '') + (complete(l) ? ' ✓' : '') + '</span></div>';
      var tools = document.createElement('div'); tools.className = 'inline';
      [['🎲 ' + c.lQuick, function () { quick(l, idx); }], [c.lClear, function () { l.main = []; l.bonus = []; draw(); }]]
        .concat(lines.length > 1 ? [['×', function () { lines.splice(idx, 1); draw(); }]] : [])
        .forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn small ghost'; b.textContent = t[0]; b.onclick = t[1]; tools.appendChild(b); });
      h.appendChild(tools); el.appendChild(h); el.appendChild(grid(l, idx, 'main', MN, MM));
      if (BN) { var p = document.createElement('p'); p.className = 'nums-label'; p.textContent = '★ ' + c.bonusLabel; el.appendChild(p); el.appendChild(grid(l, idx, 'bonus', BN, BM)); }
      box.appendChild(el);
    });
    total();
  }
  function total() {
    var n = lines.filter(complete).length * +f.elements.draws.value;
    document.getElementById('s-cost').textContent = usd(n * +c.cost);
    document.getElementById('s-fee').textContent = usd(n * +c.fee);
    document.getElementById('s-total').textContent = usd(n * (+c.cost + +c.fee));
    document.getElementById('submit').disabled = n === 0;
    f.elements.lines.value = JSON.stringify(lines.filter(complete));
  }
  document.getElementById('addline').onclick = function () { if (lines.length < 20) { lines.push({ main: [], bonus: [] }); draw(); } };
  f.elements.draws.onchange = total;
  lines.push({ main: [], bonus: [] }); draw();
})();
