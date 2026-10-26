import { byId, rods, baits, bobbers, decorations, totalCaught, discoveries } from './catches.js';
export const SAVE_KEY = 'eliana.fishing.v1';
export const SAVE_VERSION = 2;
const cap = (value, max = 1e9) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0;
const allIds = new Set([...rods,...baits,...bobbers,...decorations].map(item=>item.id));
const decorIds = new Set(decorations.map(item=>item.id));
export function freshSave() {
  return { version:SAVE_VERSION, collection:{}, highScore:0, coins:10, owned:['driftwood','crumbs','classic'], placedDecor:[], rod:'driftwood', bait:'crumbs', bobber:'classic', dryStreak:0, muted:true };
}
export function normalizeSave(input) {
  const data = freshSave();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return data;
  data.highScore = cap(input.highScore);
  data.dryStreak = cap(input.dryStreak, 100);
  for (const key of ['muted']) if (typeof input[key] === 'boolean') data[key] = input[key];
  if (input.collection && typeof input.collection === 'object') {
    for (const [id, entry] of Object.entries(input.collection)) {
      if (!Object.hasOwn(byId, id) || !entry || typeof entry !== 'object' || !cap(entry.count, 1e6)) continue;
      data.collection[id] = {
        count: cap(entry.count, 1e6),
        largest: typeof entry.largest === 'number' && Number.isFinite(entry.largest) ? Math.min(1000, Math.max(0, entry.largest)) : null,
        smallest: typeof entry.smallest === 'number' && Number.isFinite(entry.smallest) ? Math.min(1000, Math.max(0, entry.smallest)) : null,
        perfectCatches: cap(entry.perfectCatches, 1e6),
        lastCatch: entry.lastCatch && typeof entry.lastCatch === 'object' ? {
          isNew: Boolean(entry.lastCatch.isNew),
          sizeRecord: Boolean(entry.lastCatch.sizeRecord),
          perfect: Boolean(entry.lastCatch.perfect)
        } : null,
        firstCaught: typeof entry.firstCaught === 'string' && Number.isFinite(Date.parse(entry.firstCaught)) ? new Date(entry.firstCaught).toISOString() : null
      };
    }
  }
  const legacy=!input.version||input.version===1;
  const base={common:3,uncommon:6,rare:12,secret:22};
  data.coins=legacy?Object.entries(data.collection).reduce((sum,[id,entry])=>sum+entry.count*(byId[id]?.category==='junk'?1:(base[byId[id]?.rarity]||3)),0)+discoveries(data)*5:cap(input.coins);
  if(legacy){
    data.owned=['driftwood','crumbs','classic'];const count=totalCaught(data),found=discoveries(data);
    if(count>=3)data.owned.push('seaweed');if(count>=5)data.owned.push('sea-glass');if(count>=8)data.owned.push('sparkle');if(found>=10)data.owned.push('ribbon');
  } else data.owned=[...new Set(['driftwood','crumbs','classic',...(Array.isArray(input.owned)?input.owned.filter(id=>allIds.has(id)):[])])];
  data.placedDecor=legacy?[]:[...new Set(Array.isArray(input.placedDecor)?input.placedDecor.filter(id=>decorIds.has(id)&&data.owned.includes(id)):[])];
  if (rods.some(rod => rod.id === input.rod) && data.owned.includes(input.rod)) data.rod = input.rod;
  if (baits.some(bait => bait.id === input.bait) && data.owned.includes(input.bait)) data.bait = input.bait;
  if (bobbers.some(bobber => bobber.id === input.bobber) && data.owned.includes(input.bobber)) data.bobber = input.bobber;
  return data;
}
export function createStore(storage, onIssue = () => {}) {
  let readOnly = false;
  return {
    load() {
      try {
        const raw = storage.getItem(SAVE_KEY);
        if (!raw) return freshSave();
        const input = JSON.parse(raw);
        if (input?.version > SAVE_VERSION) {
          readOnly = true;
          onIssue('this save belongs to a different game version. you can play, but it will not be overwritten.');
          return freshSave();
        }
        const migrated=normalizeSave(input);
        if((input?.version||1)<SAVE_VERSION) try { storage.setItem(SAVE_KEY,JSON.stringify(migrated)); } catch {}
        return migrated;
      } catch {
        onIssue('your saved progress could not be read. starting fresh; progress will save here if your browser allows it.');
        return freshSave();
      }
    },
    save(data) {
      if (readOnly) return false;
      try { storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(data))); return true; }
      catch { onIssue('saving is unavailable in this browser. you can keep playing, but new progress may be lost when you leave.'); return false; }
    },
    reset() {
      try { storage.removeItem(SAVE_KEY); readOnly = false; return true; }
      catch { onIssue('your browser could not reset the saved progress. please allow local storage and try again.'); return false; }
    }
  };
}
