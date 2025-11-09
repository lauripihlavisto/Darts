// public/js/state.js
export function newSet(p1, p2, gameType, setSize, firstThrow, bustRule){
  const players = [{id:0, name:p1.trim()}, {id:1, name:p2.trim()}];
  const leg = newLegInternal(gameType, 1, firstThrow);
  return { players, gameType, setSize, wins:{0:0,1:0}, legs:[leg], winnerId:null, bustRule };
}
function newLegInternal(gameType, legNumber, firstThrow){
  return { startingScore: gameType, remaining:{0:gameType,1:gameType}, turns:[], winnerId:null, activePlayerId:firstThrow, legNumber };
}
export function startNextLeg(state){
  const nextLegNumber = state.legs.length + 1;
  const firstThrow = nextLegNumber % 2 === 1 ? 0 : 1;
  const leg = newLegInternal(state.gameType, nextLegNumber, firstThrow);
  return {...state, legs:[...state.legs, leg]};
}
export function getCurrentLeg(state){ return state.legs[state.legs.length - 1]; }
export function addTurn(state, score, note){
  const leg = getCurrentLeg(state);
  if (leg.winnerId !== null) return state;
  const pid = leg.activePlayerId;
  const remaining = leg.remaining[pid] - score;
  let finalScore = score;
  let winnerId = leg.winnerId;
  if (remaining < 0 && state.bustRule === 'on'){
    finalScore = 0;
  } else if (remaining === 0){
    winnerId = pid;
  }
  const turn = { id: cryptoRandomId(), playerId: pid, score: finalScore, note: (note||'').trim() || undefined };
  const newRemaining = {...leg.remaining};
  newRemaining[pid] = Math.max(0, newRemaining[pid] - finalScore);
  const nextActive = pid === 0 ? 1 : 0;
  const newLeg = {...leg, remaining:newRemaining, turns:[...leg.turns, turn], winnerId, activePlayerId: nextActive };
  let wins = state.wins;
  let winnerIdSet = state.winnerId;
  if (winnerId !== null){
    wins = {...wins, [winnerId]: wins[winnerId] + 1};
    const majority = Math.floor(state.setSize/2) + 1;
    if (wins[winnerId] >= majority) winnerIdSet = winnerId;
  }
  const legs = [...state.legs.slice(0,-1), newLeg];
  return {...state, legs, wins, winnerId: winnerIdSet};
}
export function passTurn(state){
  const leg = getCurrentLeg(state);
  if (leg.winnerId !== null) return state;
  const pid = leg.activePlayerId;
  const turn = { id: cryptoRandomId(), playerId: pid, score: 0, note: 'Pass' };
  const nextActive = pid === 0 ? 1 : 0;
  const newLeg = {...leg, turns:[...leg.turns, turn], activePlayerId: nextActive};
  const legs = [...state.legs.slice(0,-1), newLeg];
  return {...state, legs};
}
export function editTurn(state, turnId, newScore, newNote){
  const legIndex = state.legs.length - 1;
  const leg = state.legs[legIndex];
  const base = {
    ...leg, remaining:{0: state.gameType, 1: state.gameType},
    turns:[], winnerId:null, activePlayerId: leg.legNumber % 2 === 1 ? 0 : 1
  };
  const applyTurn = (acc, t)=>{
    if (acc.winnerId !== null) return acc;
    const pid = t.playerId;
    const remaining = acc.remaining[pid] - t.score;
    let s = t.score;
    let w = acc.winnerId;
    if (remaining < 0 && state.bustRule === 'on'){ s = 0; }
    else if (remaining === 0){ w = pid; }
    const newRemaining = {...acc.remaining, [pid]: Math.max(0, acc.remaining[pid] - s)};
    return {...acc, remaining:newRemaining, winnerId:w, activePlayerId: pid===0?1:0, turns:[...acc.turns, {id: cryptoRandomId(), playerId: pid, score:s, note: t.note}]};
  };
  const mutatedTurns = leg.turns.map(t=> t.id===turnId ? {...t, score:newScore, note:(newNote||'').trim() || undefined} : t);
  const rebuilt = mutatedTurns.reduce(applyTurn, base);
  let wins = {...state.wins};
  let winnerIdSet = state.winnerId;
  const prevWinner = leg.winnerId;
  if (prevWinner !== null) wins[prevWinner] = Math.max(0, wins[prevWinner]-1);
  if (rebuilt.winnerId !== null){
    wins[rebuilt.winnerId] += 1;
    const majority = Math.floor(state.setSize/2) + 1;
    if (wins[rebuilt.winnerId] >= majority) winnerIdSet = rebuilt.winnerId; else winnerIdSet = null;
  } else {
    winnerIdSet = null;
  }
  const legs = [...state.legs.slice(0,-1), rebuilt];
  return {...state, legs, wins, winnerId:winnerIdSet};
}
export function deleteTurn(state, turnId){
  const leg = getCurrentLeg(state);
  const filtered = leg.turns.filter(t=>t.id !== turnId);
  // rebuild
  let s = {...state, legs:[{...leg, turns:[]}], wins:{...state.wins}, winnerId:null};
  for (const t of filtered){ s = addTurn(s, t.score, t.note); }
  return s;
}
export function statsFor(state){
  const leg = getCurrentLeg(state);
  const turnsBy = pid => leg.turns.filter(t=>t.playerId===pid);
  const sum = ns => ns.reduce((a,b)=>a+b,0);
  const avg = ns => ns.length ? (sum(ns)/ns.length) : 0;
  const p0 = turnsBy(0).map(t=>t.score);
  const p1 = turnsBy(1).map(t=>t.score);
  return {
    legNumber: leg.legNumber,
    p0: { remaining: leg.remaining[0], total: sum(p0), turns: p0.length, average: +avg(p0).toFixed(1), highestTurn: Math.max(0, ...p0) },
    p1: { remaining: leg.remaining[1], total: sum(p1), turns: p1.length, average: +avg(p1).toFixed(1), highestTurn: Math.max(0, ...p1) }
  };
}
export function toCsv(state){
  const lines = ['Leg,Turn #,Player,Score,Note,Remaining after turn'];
  state.legs.forEach(leg=>{
    let rem = {0: leg.startingScore, 1: leg.startingScore};
    leg.turns.forEach((t, idx)=>{
      rem[t.playerId] = Math.max(0, rem[t.playerId] - t.score);
      lines.push([leg.legNumber, idx+1, t.playerId, t.score, t.note??'', rem[t.playerId]].join(','));
    });
  });
  return lines.join('\n');
}
function cryptoRandomId(){
  try{
    const a = new Uint8Array(8);
    self.crypto.getRandomValues(a);
    return Array.from(a).map(x=>x.toString(16).padStart(2,'0')).join('');
  }catch{
    return Math.random().toString(36).slice(2);
  }
}
