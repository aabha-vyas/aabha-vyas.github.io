// Applies the saved theme before the page paints, and wires up the toggle button.
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  root.setAttribute('data-theme', saved || 'dark');

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('themeBtn');
    if (!button) return;
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      window.dispatchEvent(new Event('themechange'));
    });
  });
})();
