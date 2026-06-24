(function () {
'use strict';
var header = document.querySelector('.site-header');
var toggle = document.querySelector('.nav-toggle');
if (toggle && header) {
toggle.addEventListener('click', function () {
var open = header.classList.toggle('nav-open');
toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
document.querySelectorAll('.site-nav a').forEach(function (a) {
a.addEventListener('click', function () { header.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); });
});
}
var widget = document.getElementById('app-widget');
if (!widget) return;
var SAMPLES = [
{ addr: '0x7a25...e91f', lvl: 'low', label: 'Low risk', score: 12, sigs: [['ok', 'No sanctions match'], ['ok', 'No mixer exposure'], ['ok', 'Reputable exchange']] },
{ addr: '0x3fd0...b4a2', lvl: 'med', label: 'Medium risk', score: 54, sigs: [['ok', 'No sanctions match'], ['bad', 'Mixer exposure'], ['ok', 'Some CEX history']] },
{ addr: 'bc1qature...0c7', lvl: 'high', label: 'High risk', score: 88, sigs: [['bad', 'Sanctions exposure'], ['bad', 'Darknet linked'], ['bad', 'Stolen-funds trace']] }
];
var COLORS = { low: '#2BBF77', med: '#E0A82E', high: '#E0556E' };
var addr = widget.querySelector('.aml-addr');
var badge = widget.querySelector('.risk-badge');
var score = widget.querySelector('.risk-score');
var meter = widget.querySelector('.aml-meter i');
var sigbox = widget.querySelector('.aml-signals');
var btn = widget.querySelector('.aml-go');
var i = 0;
function render() {
var s = SAMPLES[i];
if (addr) addr.value = s.addr;
if (badge) { badge.textContent = s.label; badge.className = 'risk-badge risk-' + s.lvl; }
if (score) score.textContent = 'Score ' + s.score + '/100';
if (meter) { meter.style.width = s.score + '%'; meter.style.background = COLORS[s.lvl]; }
if (sigbox) { sigbox.innerHTML = ''; s.sigs.forEach(function (g) { var el = document.createElement('span'); el.className = 'sig ' + g[0]; el.textContent = g[1]; sigbox.appendChild(el); }); }
}
function next() { i = (i + 1) % SAMPLES.length; render(); }
if (btn) btn.addEventListener('click', next);
if (addr) addr.addEventListener('click', next);
render();
})();
