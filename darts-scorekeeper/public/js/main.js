// public/js/main.js
import { newSet, getCurrentLeg } from './state.js';
import { renderAll, wireTopButtons, wireTurnForm, announce } from './ui.js';

const history = { past: [], present: null, future: [] };

function pushState(next){
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
  history.future.unshift(structuredClone(history.present));
  history.present = history.past.pop();
  render(); syncButtons(); announce('Undid.');
}
function redo(){
  if (!canRedo()) return;
  history.past.push(structuredClone(history.present));
  history.present = history.future.shift();
  render(); syncButtons(); announce('Redid.');
}
function syncButtons(){
  ui.buttons.undo.disabled = !canUndo();
  ui.buttons.redo.disabled = !canRedo();
}
const ui = {
  elScoreboard: document.getElementById('scoreboard'),
  elHistory: document.getElementById('history'),
  elStats: document.getElementById('stats'),
  elStatus: document.getElementById('status'),
  buttons: {
    newLeg: document.getElementById('newLegBtn'),
    undo: document.getElementById('undoBtn'),
    redo: document.getElementById('redoBtn'),
    exportCsv: document.getElementById('exportCsvBtn'),
    print: document.getElementById('printBtn')
  },
  turnForm: document.getElementById('turnForm'),
  turnScore: document.getElementById('turnScore'),
  turnNote: document.getElementById('turnNote')
};
function render(){
  if (!history.present) return;
  renderAll(ui, history.present, pushState);
  const leg = getCurrentLeg(history.present);
  const addBtn = document.getElementById('addTurnBtn');
  addBtn.disabled = !!(history.present.winnerId || leg.winnerId !== null);
}
function init(){
  const helpBtn = document.getElementById('helpBtn');
  const helpDialog = document.getElementById('helpDialog');
  helpBtn.addEventListener('click', ()=> helpDialog.showModal());

  const form = document.getElementById('setupForm');
  const resetSetBtn = document.getElementById('resetSetBtn');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const p1 = String(fd.get('p1')||'').trim();
    const p2 = String(fd.get('p2')||'').trim();
    const startScore = Number(fd.get('startScore')||'501');
    const setSize = Math.max(1, Math.floor(Number(fd.get('setSize')||'5')));
    const firstThrow = Number(fd.get('firstThrow')||'0')|0;
    const bustRule = (String(fd.get('bustRule')||'off') === 'on' ? 'on':'off');

    if (!p1 || !p2){
      alert('Please provide both player names.');
      return;
    }
    history.past = [];
    history.future = [];
    history.present = newSet(p1, p2, startScore, setSize, firstThrow, bustRule);
    render();
    syncButtons();
    document.getElementById('addTurnBtn').disabled = false;
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
      document.getElementById('addTurnBtn').disabled = true;
      resetSetBtn.disabled = true;
      announce('Set reset.');
      document.getElementById('p1').focus();
    }
  });
  wireTopButtons(ui, ()=>history.present, pushState);
  wireTurnForm(ui, ()=>history.present, pushState);
  window.addEventListener('keydown', (e)=>{
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key.toLowerCase()==='u'){ e.preventDefault(); undo(); }
    if (e.key.toLowerCase()==='r'){ e.preventDefault(); redo(); }
    if (e.key.toLowerCase()==='n'){ e.preventDefault(); ui.buttons.newLeg.click(); }
  });
  ui.buttons.undo.addEventListener('click', undo);
  ui.buttons.redo.addEventListener('click', redo);
}
init();
