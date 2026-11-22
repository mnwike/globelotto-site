// Static preview: work out each lottery's next draw in the browser and keep ordering switched off.
(function () {
  var G = {"us-powerball":{"days":[1,3,6],"time":"27:59"},"mega-millions":{"days":[2,5],"time":"28:00"},"euromillions":{"days":[2,5],"time":"20:00"},"eurojackpot":{"days":[2,5],"time":"19:00"},"superenalotto":{"days":[2,4,5,6],"time":"19:00"},"uk-lotto":{"days":[3,6],"time":"20:00"},"irish-lotto":{"days":[3,6],"time":"20:00"},"la-primitiva":{"days":[1,4,6],"time":"20:30"},"mega-sena":{"days":[2,4,6],"time":"23:00"},"canada-649":{"days":[3,6],"time":"27:30"},"oz-lotto":{"days":[2],"time":"09:30"},"sa-powerball":{"days":[2,5],"time":"19:00"}}, CUT = 3 * 3600;
  function next(g) {
    var n = new Date(), now = n.getTime() / 1000;
    for (var i = 0; i < 60; i++) {
      var d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + i));
      if (g.days.indexOf(d.getUTCDay()) < 0) continue;
      var p = g.time.split(':'), ts = d.getTime() / 1000 + p[0] * 3600 + p[1] * 60;
      if (ts > now + CUT) return ts;
    }
    return 0;
  }
  document.querySelectorAll('[data-g]').forEach(function (el) { var g = G[el.dataset.g]; if (g) el.dataset.ts = next(g); });
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    if (document.getElementById('pv-note')) return;
    var p = document.createElement('p'); p.id = 'pv-note'; p.className = 'notice'; p.textContent = 'Preview: accounts and ticket ordering are not open yet.';
    e.target.querySelector('.summary').appendChild(p);
  });
})();
