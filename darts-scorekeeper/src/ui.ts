import { SetState, Turn } from './types.js';
import { addTurn, deleteTurn, editTurn, getCurrentLeg, passTurn, startNextLeg, statsFor, toCsv } from './state.js';

export interface UIBindings {
  elScoreboard: HTMLElement;
  elHistory: HTMLElement;
  elStats: HTMLElement;
  elStatus: HTMLElement;
  buttons: {
    newLeg: HTMLButtonElement;
    undo: HTMLButtonElement;
    redo: HTMLButtonElement;
    exportCsv: HTMLButtonElement;
    print: HTMLButtonElement;
  };
  turnForm: HTMLFormElement;
  turnScore: HTMLInputElement;
  turnNote: HTMLInputElement;
}

export type HistoryReducer = (s:SetState)=>void;

export function renderAll(bind: UIBindings, state: SetState, push: HistoryReducer){
  renderScoreboard(bind.elScoreboard, state);
  renderHistory(bind.elHistory, state, push);
  renderStats(bind.elStats, state);
  updateActionStates(bind, state);
}

function updateActionStates(bind: UIBindings, state: SetState){
  const leg = getCurrentLeg(state);
  bind.buttons.newLeg.disabled = !(leg.winnerId !== null && state.winnerId === null);
  (document.getElementById('addTurnBtn') as HTMLButtonElement).disabled = !!(state.winnerId || leg.winnerId!==null);
}

function renderScoreboard(root: HTMLElement, state: SetState){
  const leg = getCurrentLeg(state);
  const p0 = state.players[0];
  const p1 = state.players[1];
  root.innerHTML = `
    ${[p0,p1].map((p)=>`
      <article class="player-card" aria-live="polite" aria-atomic="true">
        <header>
          <h3>${escapeHtml(p.name)}</h3>
          <span class="badge ${leg.activePlayerId===p.id ? 'turn':''}" aria-label="${p.name} ${leg.activePlayerId===p.id?'to throw':''}">
            ${leg.activePlayerId===p.id?'• Turn':'•'}
          </span>
        </header>
        <div class="totals">
          <div class="kv"><span class="k">Remaining</span><span class="v">${leg.remaining[p.id]}</span></div>
          <div class="kv"><span class="k">Legs won</span><span class="v">${state.wins[p.id]}</span></div>
          <div class="kv"><span class="k">Starting</span><span class="v">${state.gameType}</span></div>
        </div>
      </article>
    `).join('')}
  `;
}

function renderHistory(root: HTMLElement, state: SetState, push: HistoryReducer){
  const leg = getCurrentLeg(state);
  root.innerHTML = '';
  if (leg.turns.length===0){
    root.innerHTML = '<p class="muted">No turns yet.</p>';
    return;
  }
  leg.turns.forEach((t, i)=>{
    const article = document.createElement('article');
    article.className = 'turn-row';
    const who = state.players[t.playerId].name;
    article.innerHTML = `
      <div class="who" aria-label="Turn ${i+1}">${i+1}. ${escapeHtml(who)}</div>
      <div class="score"><strong>${t.score}</strong></div>
      <div class="note">${t.note? escapeHtml(t.note): ''}</div>
      <div class="actions">
        <button class="btn ghost edit">Edit</button>
        <button class="btn danger delete">Delete</button>
      </div>
    `;
    const btnDel = article.querySelector('button.delete') as HTMLButtonElement;
    const btnEdit = article.querySelector('button.edit') as HTMLButtonElement;

    btnDel.addEventListener('click', ()=>{
      push(deleteTurn(state, t.id));
      announce(`Deleted turn ${i+1}.`);
    });

    btnEdit.addEventListener('click', ()=>{
      // inline editor
      const scoreCell = article.querySelector('.score') as HTMLElement;
      const noteCell = article.querySelector('.note') as HTMLElement;
      scoreCell.innerHTML = `<input type="number" min="0" max="180" value="${t.score}">`;
      noteCell.innerHTML = `<input type="text" maxlength="40" value="${t.note??''}">`;
      btnEdit.textContent = 'Save';
      btnEdit.classList.add('ok');
      const save = ()=>{
        const newScore = Number((scoreCell.querySelector('input') as HTMLInputElement).value || '0');
        const newNote = (noteCell.querySelector('input') as HTMLInputElement).value;
        push(editTurn(state, t.id, newScore, newNote));
        announce('Edited turn.');
      };
      btnEdit.onclick = save;
    });

    root.appendChild(article);
  });
}

function renderStats(root: HTMLElement, state: SetState){
  const s = statsFor(state);
  root.innerHTML = `
    <div class="stat"><div class="label">Leg</div><div class="value">#${s.legNumber}</div></div>
    <div class="stat"><div class="label">${escapeHtml(state.players[0].name)} average</div><div class="value">${s.p0.average}</div></div>
    <div class="stat"><div class="label">${escapeHtml(state.players[1].name)} average</div><div class="value">${s.p1.average}</div></div>
    <div class="stat"><div class="label">Highest turn</div><div class="value">${Math.max(s.p0.highestTurn, s.p1.highestTurn)}</div></div>
  `;
}

export function wireTurnForm(bind: UIBindings, getState: ()=>SetState, push: HistoryReducer){
  bind.turnForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const score = Number(bind.turnScore.value || '0');
    if (score < 0 || score > 180) {
      announce('Turn score must be between 0 and 180.');
      bind.turnScore.focus();
      return;
    }
    const s = getState();
    const leg = getCurrentLeg(s);
    const pid = leg.activePlayerId;
    const wouldBe = leg.remaining[pid] - score;
    if (wouldBe < 0 && s.bustRule === 'off'){
      // friendly warning, allow
      announce('Warning: Below zero. If this is a bust, set score to 0.');
    }
    push(addTurn(s, score, bind.turnNote.value));
    bind.turnScore.value = '';
    bind.turnNote.value = '';
    bind.turnScore.focus();
  });
  document.getElementById('passBtn')!.addEventListener('click', ()=>{
    const s = getState();
    push(passTurn(s));
  });
}

export function wireTopButtons(bind: UIBindings, getState: ()=>SetState, push: HistoryReducer){
  bind.buttons.exportCsv.addEventListener('click', ()=>{
    const csv = toCsv(getState());
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'darts-set.csv';
    a.click();
    URL.revokeObjectURL(url);
    announce('Exported CSV.');
  });
  bind.buttons.print.addEventListener('click', ()=>{
    window.print();
  });
  bind.buttons.newLeg.addEventListener('click', ()=>{
    const s = getState();
    if (s.winnerId !== null) return;
    push(startNextLeg(s));
    announce('Started next leg.');
  });
}

export function announce(msg: string){
  const el = document.getElementById('status')!;
  el.textContent = msg;
}

function escapeHtml(x:string){
  return x.replace(/[&<>"']/g, (m)=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m] as string));
}
