import '@fontsource/teko/600.css';
import '@fontsource/teko/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import './splash.css';

const steps = ['Güncellemeler kontrol ediliyor…', 'Oturum kontrol ediliyor…', 'Arayüz hazırlanıyor…'];

const root = document.getElementById('splash')!;
root.innerHTML = `
  <div class="splash-panel" aria-hidden="true"></div>
  <div class="splash-body">
    <div class="splash-brand"><div class="splash-mark"></div><span>DRILL</span></div>
    <div class="splash-slogan">OYNA. ÖLÇ. <em>GELİŞ.</em></div>
    <div class="splash-bottom">
      <div class="splash-status"><span role="status" id="step"></span><span id="pct"></span></div>
      <div class="splash-bar"><div id="fill"></div></div>
      <div class="splash-foot"><span>Riot Games tarafından onaylanmamıştır.</span><span>v0.1.0 · BETA</span></div>
    </div>
  </div>`;

const stepEl = document.getElementById('step')!;
const pctEl = document.getElementById('pct')!;
const fillEl = document.getElementById('fill')!;

let pct = 0;
const timer = setInterval(() => {
  pct = Math.min(pct + 2, 100);
  stepEl.textContent = steps[Math.min(Math.floor(pct / 34), steps.length - 1)]!;
  pctEl.textContent = `${pct}%`;
  fillEl.style.width = `${pct}%`;
  if (pct === 100) clearInterval(timer);
}, 30);
