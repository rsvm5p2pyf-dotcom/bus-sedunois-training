// app.js - main application logic
const $content = document.getElementById('content');

const STORAGE_KEY = 'treino_bus_state_v1';

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function loadState(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }catch(e){return {}}}
function clearState(){ localStorage.removeItem(STORAGE_KEY); }

let state = loadState();

function renderHome(){
  state.line = state.line || null;
  state.direction = state.direction || null;
  state.index = (typeof state.index === 'number') ? state.index : 0;
  saveState(state);

  $content.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'card-list';

  for(const line of Object.keys(ROUTES)){
    const card = document.createElement('button');
    card.className = 'line-card';
    card.type = 'button';
    card.textContent = line;
    card.addEventListener('click', ()=>{
      state.line = line; state.direction = null; state.index = 0; saveState(state); renderDirections(line);
    });
    container.appendChild(card);
  }

  const resetBtn = document.createElement('button');
  resetBtn.className = 'button secondary';
  resetBtn.textContent = '↺ REINICIAR PROGRESSO';
  resetBtn.addEventListener('click', ()=>{ if(confirm('Reiniciar todo o progresso?')){ clearState(); state = {}; renderHome(); }});

  $content.appendChild(container);
  $content.appendChild(document.createElement('div')).className='spacer';
  $content.appendChild(resetBtn);
}

function renderDirections(line){
  const data = ROUTES[line];
  if(!data){ renderHome(); return; }
  $content.innerHTML = '';

  const back = document.createElement('button'); back.className='button secondary'; back.textContent='← VOLTAR ÀS LINHAS'; back.addEventListener('click', ()=>{ renderHome(); });
  $content.appendChild(back);

  const h = document.createElement('h2'); h.textContent = line; h.style.marginTop='12px'; $content.appendChild(h);

  const dirContainer = document.createElement('div'); dirContainer.className='dir-list';
  for(const dirLabel of Object.keys(data.directions)){
    const btn = document.createElement('button'); btn.className='dir-item'; btn.type='button'; btn.textContent = dirLabel;
    btn.addEventListener('click', ()=>{
      state.line = line; state.direction = dirLabel; state.index = 0; saveState(state); renderRoute();
    });
    dirContainer.appendChild(btn);
  }
  $content.appendChild(dirContainer);
}

function renderRoute(){
  const {line,direction,index} = state;
  if(!line || !direction){ renderHome(); return; }
  const stops = ROUTES[line].directions[direction];
  if(!stops){ renderDirections(line); return; }

  $content.innerHTML = '';
  const top = document.createElement('div'); top.style.display='flex'; top.style.justifyContent='space-between';
  const back = document.createElement('button'); back.className='button secondary'; back.textContent='← ESCOLHER OUTRA LINHA'; back.addEventListener('click', ()=>{ state.direction=null; state.index=0; saveState(state); renderDirections(line); });
  top.appendChild(back);

  const reset = document.createElement('button'); reset.className='button secondary'; reset.textContent='↺ REINICIAR PERCURSO'; reset.addEventListener('click', ()=>{ if(confirm('Reiniciar este percurso ao início?')){ state.index=0; saveState(state); renderRoute(); }});
  top.appendChild(reset);
  $content.appendChild(top);

  const title = document.createElement('h2'); title.textContent = `${line} — ${direction}`; $content.appendChild(title);

  // Progress
  const progress = document.createElement('div'); progress.className='route-view';

  const counter = document.createElement('div'); counter.style.fontWeight='700'; counter.textContent = `PARAGEM ${index+1} / ${stops.length}`;
  progress.appendChild(counter);

  const curr = document.createElement('div'); curr.style.marginTop='6px'; curr.innerHTML = `<div style="font-size:15px;font-weight:700">Paragem atual:</div><div style="font-size:18px">${stops[index]}</div>`;
  progress.appendChild(curr);

  const nextStopText = (index+1 < stops.length) ? stops[index+1] : null;
  const next = document.createElement('div'); next.style.marginTop='6px'; next.innerHTML = `<div style="font-size:13px;color:${getComputedStyle(document.documentElement).getPropertyValue('--muted')}">Próxima paragem:</div><div style="font-size:16px">${nextStopText || '—'}</div>`;
  progress.appendChild(next);

  // Buttons
  const btns = document.createElement('div'); btns.className='controls';

  const mapsBtn = document.createElement('a'); mapsBtn.className='button big'; mapsBtn.textContent='🚗 NAVEGAR PARA A PRÓXIMA PARAGEM';
  mapsBtn.href = '#'; mapsBtn.target='_blank';
  if(nextStopText){
    const origin = encodeURIComponent(`${stops[index]}, Sion, Valais, Switzerland`);
    const dest = encodeURIComponent(`${nextStopText}, Sion, Valais, Switzerland`);
    mapsBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  } else {
    mapsBtn.classList.add('secondary'); mapsBtn.textContent='— Última paragem —'; mapsBtn.setAttribute('aria-disabled','true');
  }
  btns.appendChild(mapsBtn);

  const arrived = document.createElement('button'); arrived.className='button big'; arrived.textContent='✓ CHEGUEI À PARAGEM';
  arrived.addEventListener('click', ()=>{
    if(index+1 >= stops.length){
      // finished
      state.index = stops.length; saveState(state); renderCompletion(); return;
    }
    state.index = index+1; saveState(state); renderRoute();
  });
  btns.appendChild(arrived);

  progress.appendChild(btns);

  // Overview
  const ov = document.createElement('div'); ov.className='route-overview';
  ov.setAttribute('role','list');
  const list = document.createElement('div');
  list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='6px';
  for(let i=0;i<stops.length;i++){
    const s = document.createElement('div'); s.className='stop-item';
    const idx = document.createElement('div'); idx.className='stop-index'; idx.textContent = (i+1);
    if(i < index) idx.classList.add('stop-done');
    if(i === index) idx.classList.add('stop-current');
    const txt = document.createElement('div'); txt.textContent = stops[i];
    if(i < index) txt.classList.add('stop-done');
    s.appendChild(idx); s.appendChild(txt);
    list.appendChild(s);
  }
  ov.appendChild(list);
  progress.appendChild(ov);

  $content.appendChild(progress);
}

function renderCompletion(){
  const {line,direction} = state; const stops = ROUTES[line].directions[direction] || [];
  $content.innerHTML = '';
  const back = document.createElement('button'); back.className='button secondary'; back.textContent='← VOLTAR ÀS LINHAS'; back.addEventListener('click', ()=>{ state.line=null; state.direction=null; state.index=0; saveState(state); renderHome(); });
  $content.appendChild(back);

  const h = document.createElement('h2'); h.textContent='🏁 PERCURSO CONCLUÍDO'; $content.appendChild(h);
  const p = document.createElement('p'); p.innerHTML = `Parabéns! Completaste a linha <strong>${line}</strong> no sentido <strong>${direction}</strong>.`; $content.appendChild(p);

  const actions = document.createElement('div'); actions.className='footer-actions';
  const repeat = document.createElement('button'); repeat.className='button'; repeat.textContent='🔄 REPETIR PERCURSO'; repeat.addEventListener('click', ()=>{ state.index=0; saveState(state); renderRoute(); });
  const backLines = document.createElement('button'); backLines.className='button secondary'; backLines.textContent='← VOLTAR ÀS LINHAS'; backLines.addEventListener('click', ()=>{ state.line=null; state.direction=null; state.index=0; saveState(state); renderHome(); });
  actions.appendChild(repeat); actions.appendChild(backLines);
  $content.appendChild(actions);
}

// Initialization: restore if possible
(function init(){
  if(state.line && state.direction && typeof state.index === 'number'){
    // confirm route still exists
    if(ROUTES[state.line] && ROUTES[state.line].directions[state.direction]){
      renderRoute(); return;
    }
  }
  renderHome();
})();
