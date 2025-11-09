import { newSet, getCurrentLeg } from './state.js';
import { UIBindings, renderAll, wireTopButtons, wireTurnForm, announce } from './ui.js';
import type { SetState } from './types.js';

// Simple history (undo/redo)
interface History {
  past: SetState[];
  present: SetState | null;
  future: SetState[];
}

const history: History = { past: [], present: null, future: [] };

function pushState(next: SetState){
  if (history.present) history.past.push(structuredClone(history.present));
  history.present = structuredClone(next);
  history.future = [];
  render();
  syncButtons();
}

function canUndo(){ return history.past.length > 0; }
function canRedo(){ return history.future.length > 0; }

function undo(){
  if (!canUndo()) return;
  history.future.unshift(structuredClone(history.present!));
  history.present = history.past.pop()!;
  render(); syncButtons(); announce('Undid.');
}
function redo(){
  if (!canRedo()) return;
  history.past.push(structuredClone(history.present!));
  history.present = history.future.shift()!;
  render(); syncButtons(); announce('Redid.');
}

function syncButtons(){
  ui.buttons.undo.disabled = !canUndo();
  ui.buttons.redo.disabled = !canRedo();
}

const ui: UIBindings = {
  elScoreboard: document.getElementById('scoreboard')!,
  elHistory: document.getElementById('history')!,
  elStats: document.getElementById('stats')!,
  elStatus: document.getElementById('status')!,
  buttons: {
    newLeg: document.getElementById('newLegBtn') as HTMLButtonElement,
    undo: document.getElementById('undoBtn') as HTMLButtonElement,
    redo: document.getElementById('redoBtn') as HTMLButtonElement,
    exportCsv: document.getElementById('exportCsvBtn') as HTMLButtonElement,
    print: document.getElementById('printBtn') as HTMLButtonElement
  },
  turnForm: document.getElementById('turnForm') as HTMLFormElement,
  turnScore: document.getElementById('turnScore') as HTMLInputElement,
  turnNote: document.getElementById('turnNote') as HTMLInputElement
};

function render(){
  if (!history.present) return;
  renderAll(ui, history.present, pushState);
  const leg = getCurrentLeg(history.present);
  const addBtn = document.getElementById('addTurnBtn') as HTMLButtonElement;
  addBtn.disabled = !!(history.present.winnerId || leg.winnerId !== null);
}

function init(){
  // Help dialog
  const helpBtn = document.getElementById('helpBtn')!;
  const helpDialog = document.getElementById('helpDialog') as HTMLDialogElement;
  helpBtn.addEventListener('click', ()=> helpDialog.showModal());

  // Setup form
  const form = document.getElementById('setupForm') as HTMLFormElement;
  const resetSetBtn = document.getElementById('resetSetBtn') as HTMLButtonElement;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const p1 = String(fd.get('p1')||'').trim();
    const p2 = String(fd.get('p2')||'').trim();
    const startScore = Number(fd.get('startScore')||'501') as 301|501;
    const setSize = Math.max(1, Math.floor(Number(fd.get('setSize')||'5')));
    const firstThrow = Number(fd.get('firstThrow')||'0')|0;
    const bustRule = (String(fd.get('bustRule')||'off') === 'on' ? 'on':'off') as 'on'|'off';

    if (!p1 || !p2){
      alert('Please provide both player names.');
      return;
    }
    history.past = [];
    history.future = [];
    history.present = newSet(p1, p2, startScore, setSize, firstThrow, bustRule);
    render();
    syncButtons();
    (document.getElementById('addTurnBtn') as HTMLButtonElement).disabled = false;
    resetSetBtn.disabled = false;
    ui.buttons.newLeg.disabled = true;
    announce('Set started.');
    ui.turnScore.focus();
  });

  resetSetBtn.addEventListener('click', ()=>{
    if (confirm('Reset the current set? This clears all legs and turns.')){
      history.past = []; history.future = []; history.present = null;
      ui.elScoreboard.innerHTML = '';
      ui.elHistory.innerHTML = '';
      ui.elStats.innerHTML = '';
      (document.getElementById('addTurnBtn') as HTMLButtonElement).disabled = true;
      resetSetBtn.disabled = true;
      announce('Set reset.');
      (document.getElementById('p1') as HTMLInputElement).focus();
    }
  });

  wireTopButtons(ui, ()=>history.present!, pushState);
  wireTurnForm(ui, ()=>history.present!, pushState);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key.toLowerCase()==='u'){ e.preventDefault(); undo(); }
    if (e.key.toLowerCase()==='r'){ e.preventDefault(); redo(); }
    if (e.key.toLowerCase()==='n'){ e.preventDefault(); ui.buttons.newLeg.click(); }
  });
  ui.buttons.undo.addEventListener('click', undo);
  ui.buttons.redo.addEventListener('click', redo);
}

init();
