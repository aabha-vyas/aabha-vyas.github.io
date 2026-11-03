// Home page: Chicago clock, photo tiles, filter pills and photo lightbox.
(function () {
  var clock = document.getElementById('clock');
  if (clock) {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', second: '2-digit'
    });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  var tiles = document.getElementById('tiles');
  var box = document.getElementById('lightbox');
  if (!tiles) return;

  (window.photos || []).forEach(function (p) {
    var a = document.createElement('a');
    a.className = 'tile';
    a.dataset.kind = 'photos';
    a.href = p.src;
    var frame = document.createElement('div');
    frame.className = 'photo';
    var img = document.createElement('img');
    img.src = p.src; img.alt = p.place; img.loading = 'lazy';
    frame.appendChild(img);
    var cap = document.createElement('p');
    cap.className = 'tile-cap';
    cap.appendChild(document.createTextNode(p.place + ' '));
    var tag = document.createElement('span');
    tag.className = 'tag'; tag.textContent = p.year;
    cap.appendChild(tag);
    a.appendChild(frame); a.appendChild(cap);
    a.addEventListener('click', function (e) {
      if (!box) return;
      e.preventDefault();
      box.querySelector('img').src = p.src;
      box.querySelector('img').alt = p.place;
      box.querySelector('p').textContent = p.place + ', ' + p.year;
      box.classList.add('open');
    });
    tiles.appendChild(a);
  });

  if (box) {
    box.addEventListener('click', function () { box.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.classList.remove('open'); });
  }

  var pills = document.querySelectorAll('.pill');
  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var f = pill.dataset.filter;
      pills.forEach(function (p) { p.classList.toggle('on', p === pill); });
      tiles.querySelectorAll('.tile').forEach(function (t) {
        t.hidden = !(f === 'all' || t.dataset.kind === f);
      });
    });
  });
})();
