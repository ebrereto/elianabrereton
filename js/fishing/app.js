import { catches, rods, baits, living, spriteURL, totalCaught, discoveries, rodUnlocked, baitUnlocked, catchSize, distribution } from './catches.js';
import { createStore, freshSave } from './save.js?v=20261023-aquarium-calm';
import { FishingGame } from './game.js?v=20261023-aquarium-calm';
import { FishingAudio } from './audio.js?v=20261023-aquarium-calm';
import { Renderer, loadArt } from './renderer.js?v=20261023-aquarium-calm';
import { bindInput } from './input.js';
import { renderCollection, showDetails } from './aquarium.js?v=20261023-aquarium-calm';
const $ = selector => document.querySelector(selector);
const number = value => value.toLocaleString();

export async function start() {
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } }; }
  const store = createStore(storage, message => { $('#save-warning').textContent = message; $('#save-warning').hidden = false; });
  let save = store.load(), score = 0, view = 'fish', manualPaused = false, filter = 'all', time = 0;
  let confirmAction = null, focusBeforeDialog = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const audio = new FishingAudio(); audio.muted = save.muted;
  const renderer = new Renderer($('#dock'), $('#aquarium'), await loadArt());
  const persist = () => store.save(save);
  const game = new FishingGame(() => save, onState);
  const unlocked = () => new Set([...rods.filter(rod => rodUnlocked(rod,save)).map(rod=>rod.id), ...baits.filter(bait=>baitUnlocked(bait,save)).map(bait=>bait.id)]);
  const labels = {
    idle: ['a little quiet. cast whenever you’re ready.', 'cast line'],
    casting: ['out it goes…', 'casting…'],
    waiting: ['watch the bobber. the water is thinking about it.', 'waiting…'],
    bite: ['a bite! hook it now.', 'hook!'],
    timing: ['there’s something lively on the line…', 'pull!'],
    reeling: ['up it comes…', 'reeling…'],
    caught: ['a little something from the sea.', 'cast again'],
    escaped: ['off it goes. there’s always another fish.', 'cast again']
  };
  function stats() {
    $('#session-score').textContent = number(score); $('#best-score').textContent = number(save.highScore);
    $('#collection-count').textContent = `${discoveries(save)}/${catches.length}`;
    $('#equipped').textContent = rods.find(rod=>rod.id===save.rod).name;
    $('#sound').textContent = save.muted ? 'sound: off' : 'sound: on'; $('#sound').setAttribute('aria-pressed', String(!save.muted));
  }
  function fightUI() {
    const timing = $('#timing'), phase = game.phase;
    timing.dataset.behavior = game.behavior || 'steady';
    timing.dataset.result = '';
    // Restart the tiny feedback animation when two consecutive pulls match.
    void timing.offsetWidth;
    timing.dataset.result = game.lastResult || '';
    $('#target-zone').style.left = `${game.target*100}%`;
    $('#target-zone').style.width = `${game.width*100}%`;
    $('#line-pips').textContent = ['●','●','●'].map((pip,index)=>index<game.lineStrength?pip:'○').join(' ');
    $('#line-pips').classList.toggle('low',game.lineStrength===1);
    $('.line-strength').setAttribute('aria-label',`line strength ${game.lineStrength} out of 3`);
    const beat = (selector,state) => $(selector).dataset.state = state;
    beat('#beat-hook','done');
    beat('#beat-fight',phase==='fight'?'active':'done');
    beat('#beat-land',phase==='land'?'active':'upcoming');
    $('#beat-fight').textContent = game.fightTotal ? `fight ${Math.min(game.fightRound,game.fightTotal)}/${game.fightTotal}` : 'clean pull';
    if (phase === 'land') {
      $('#timing-instruction').textContent = game.behavior==='treasure'?'one precise pull for the treasure':'one last pull — bring it home';
      $('#action').textContent = game.behavior==='treasure'?'perfect pull!':'land it!';
    } else {
      $('#timing-instruction').textContent = game.behavior==='heavy'?'steady hands — this one is heavy':game.behavior==='fast'?'quick now — it keeps darting':game.behavior==='magic'?'the target has a mind of its own':'stop inside the striped zone';
      $('#action').textContent = 'pull!';
    }
    $('#meter').setAttribute('aria-description',`target from ${Math.round(game.target*100)} to ${Math.round((game.target+game.width)*100)} percent. ${phase==='land'?'make the final pull':'press space or pull inside the zone'}.`);
  }
  function onState(state) {
    $('#game-frame').dataset.state = state;
    $('#game-status').textContent = labels[state][0];
    $('#action').textContent = labels[state][1];
    $('#action').disabled = ['casting','waiting','reeling'].includes(state) || game.paused;
    $('#timing').hidden = state !== 'timing';
    $('#reveal').hidden = state !== 'caught';
    $('#catch-value').textContent = '';
    if (state === 'casting') { audio.play('cast'); $('#unlock-message').hidden = true; }
    if (state === 'waiting') audio.play('splash');
    if (state === 'bite') audio.play('bite');
    if (state === 'timing') {
      audio.play(game.lastResult==='perfect'?'perfect':game.lastResult==='miss'?'strain':game.lastResult==='hit'?'pull':'hook');
      fightUI();
      $('#game-status').textContent = game.phase==='land'?'one last pull. bring it home.':`keep the line steady — pull ${game.fightRound} of ${game.fightTotal}.`;
    }
    if (state === 'reeling') audio.play(game.success?'land':'strain');
    if (state === 'caught') {
      const oldUnlocks = unlocked(), item = game.item, first = !save.collection[item.id], size = catchSize(item);
      const old = save.collection[item.id];
      const perfectCatch = game.perfects >= game.fightTotal + 1;
      const sizeRecord = !first && size !== null && (old?.largest == null || old?.smallest == null || size > old.largest || size < old.smallest);
      save.collection[item.id] = {
        count: (old?.count || 0)+1,
        largest: size === null ? null : Math.max(old?.largest ?? size, size),
        smallest: size === null ? null : Math.min(old?.smallest ?? size, size),
        perfectCatches: (old?.perfectCatches || 0) + (perfectCatch ? 1 : 0),
        lastCatch: { isNew:first, sizeRecord, perfect:perfectCatch },
        firstCaught: old?.firstCaught || new Date().toISOString()
      };
      const bonus = first ? 10 : 0, perfectBonus = game.perfects * 2, totalValue = item.value + bonus + perfectBonus;
      score += totalValue;save.highScore = Math.max(save.highScore, score);
      const rare = ['rare','secret'].includes(item.rarity);
      save.dryStreak = rare ? 0 : save.dryStreak+1;
      const newUnlocks = [...rods,...baits].filter(thing=>unlocked().has(thing.id)&&!oldUnlocks.has(thing.id));
      if (newUnlocks.length) {
        $('#unlock-message').textContent = `a little bonus: ${newUnlocks.map(thing=>thing.name).join(' + ')} unlocked. find ${newUnlocks.length===1?'it':'them'} in tackle.`;
        $('#unlock-message').hidden = false;$('#unlock-dot').hidden = false;
      }
      if (discoveries(save) === 8 && first) { $('#unlock-message').textContent += ' a special shell is now waiting somewhere in the water.';$('#unlock-message').hidden=false; }
      $('#reveal-sprite').src = spriteURL(item.id);$('#reveal-sprite').alt = item.name;
      $('#reveal-name').textContent = item.name;$('#reveal-description').textContent = item.description;
      $('#reveal-tag').textContent = [first?'✦ new discovery!':null,sizeRecord?'↕ size record!':null,perfectCatch?'♥ perfect catch!':null,item.rarity].filter(Boolean).join(' · ');
      $('#reveal-stats').textContent = `${size ? `${size.toFixed(1)} cm · `:''}+${item.value} points${first?' · +10 discovery bonus':''}${perfectBonus?` · +${perfectBonus} perfect pull bonus`:''}`;
      $('#reveal').classList.toggle('rare',rare);
      $('#game-status').textContent = `${first?'a new little friend!':'a lovely little catch.'} ${item.name}.`;
      if(!living(item)) $('#game-status').textContent=`${first?'a new discovery!':'something for the shelf.'} ${item.name}.`;
      $('#catch-value').textContent=`+${totalValue}`;
      audio.play(rare||first?'rare':'caught');persist();stats();
    }
    if (state==='escaped') {
      save.dryStreak++;persist();audio.play('escaped');
      $('#game-status').textContent=game.reason==='bite'?'it nibbled and wandered off. another cast?':game.reason==='line'?'the line went slack. a cheeky little escape.':'almost. it slipped free at the dock.';
    }
  }
  function syncPause() {
    const dialogOpen = Boolean($('dialog[open]'));
    game.paused = manualPaused || document.hidden || view !== 'fish' || dialogOpen;
    $('#pause-overlay').hidden = !manualPaused;
    $('#pause').textContent = manualPaused?'resume':'pause';$('#pause').setAttribute('aria-pressed',String(manualPaused));
    $('#action').disabled = game.paused || ['casting','waiting','reeling'].includes(game.state);
    if(game.paused) audio.suspend();
  }
  function pause() { manualPaused = !manualPaused;syncPause(); if(!manualPaused) audio.unlock(); }
  function action() { audio.unlock();game.action(); }
  bindInput({canvas:$('#dock'),button:$('#action'),action,isActive:()=>view==='fish'&&!$('dialog[open]'),pause});
  $('#aquarium').addEventListener('click', event => {
    const canvas = $('#aquarium'), bounds = canvas.getBoundingClientRect();
    const item = renderer.petAquarium((event.clientX-bounds.left)*canvas.width/bounds.width,(event.clientY-bounds.top)*canvas.height/bounds.height,time);
    if (!item) return;
    audio.unlock().then(()=>audio.play('pet'));
    $('#aquarium-status').textContent = `${item.name} loved that. tiny heart!`;
  });
  $('#pause').addEventListener('click',pause);$('#resume').addEventListener('click',()=>{manualPaused=false;syncPause();audio.unlock();$('#action').focus();});
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) { manualPaused=true; } syncPause(); });
  $('#sound').addEventListener('click',()=>{save.muted=!save.muted;audio.muted=save.muted;persist();stats();if(!save.muted)audio.unlock().then(()=>audio.play('hook'));});
  $('#tutorial').hidden = true;
  $('#dismiss-tutorial').addEventListener('click',()=>{$('#tutorial').hidden=true;$('#help').setAttribute('aria-expanded','false');$('#help').focus();});
  $('#help').addEventListener('click',()=>{$('#tutorial').hidden=!$('#tutorial').hidden;$('#help').setAttribute('aria-expanded',String(!$('#tutorial').hidden));if(!$('#tutorial').hidden)$('#dismiss-tutorial').focus();});
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    view=button.dataset.view;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    for(const name of ['fish','aquarium','tackle']) $(`#${name}-view`).hidden = name!==view;
    if(view==='aquarium') renderCollection(save,filter,openDetail);
    if(view==='tackle') {renderTackle();$('#unlock-dot').hidden=true;}
    syncPause();if(view==='fish')audio.unlock();
  }));
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderCollection(save,filter,openDetail);
  }));
  function openDetail(item) { focusBeforeDialog=document.activeElement;showDetails(item,save);syncPause(); }
  $('#close-detail').addEventListener('click',()=>$('#detail-dialog').close());
  function confirm(title,copy,label,callback) {
    focusBeforeDialog=document.activeElement;confirmAction=callback;$('#confirm-title').textContent=title;$('#confirm-copy').textContent=copy;$('#accept-confirm').textContent=label;$('#confirm-dialog').showModal();$('#cancel-confirm').focus();syncPause();
  }
  for(const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('close',()=>{syncPause();focusBeforeDialog?.focus();});
  $('#cancel-confirm').addEventListener('click',()=>$('#confirm-dialog').close());
  $('#accept-confirm').addEventListener('click',()=>{confirmAction?.();confirmAction=null;$('#confirm-dialog').close();});
  $('#new-session').addEventListener('click',()=>confirm('a fresh little session?','your session score returns to zero. your best score, aquarium, and tackle all stay.','new session',()=>{score=0;game.reset();stats();}));
  $('#reset').addEventListener('click',()=>confirm('reset all progress?','this clears your aquarium, collection, tackle unlocks, best score, and settings in this browser. it cannot be undone.','reset everything',()=>{
    if(!store.reset())return;
    save=freshSave();score=0;audio.muted=true;manualPaused=false;game.reset();stats();renderCollection(save,filter,openDetail);renderTackle();
    $('#tutorial').hidden=true;$('#help').setAttribute('aria-expanded','false');$('#unlock-dot').hidden=true;$('#unlock-message').hidden=true;$('#save-warning').hidden=true;
  }));
  function renderTackle() {
    for(const [list,target,type] of [[rods,$('#rods'),'rod'],[baits,$('#baits'),'bait']]) {
      target.replaceChildren();
      for(const thing of list) {
        const available=type==='rod'?rodUnlocked(thing,save):baitUnlocked(thing,save), selected=save[type]===thing.id;
        const card=document.createElement('article');card.className='tackle-card';
        const image=document.createElement('img');image.src=spriteURL(type==='rod'?`rod-${thing.id}`:`bait-${thing.id}`);image.alt='';image.width=image.height=80;
        const heading=document.createElement('h3');heading.textContent=thing.name;
        const description=document.createElement('p');description.textContent=thing.description;
        const requirement=document.createElement('small');requirement.textContent=available?'yours to keep':`unlocks at ${thing.threshold} ${thing.kind==='discoveries'?'discoveries':'catches'} (${thing.kind==='discoveries'?discoveries(save):totalCaught(save)}/${thing.threshold})`;
        const button=document.createElement('button');button.type='button';button.disabled=!available;button.textContent=selected?'equipped':available?'equip':'locked';button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-label',`${selected?'equipped':available?'equip':'locked'}: ${thing.name}`);
        button.addEventListener('click',()=>{save[type]=thing.id;persist();stats();renderTackle();const selectedButton=[...target.querySelectorAll('button')].find(b=>b.getAttribute('aria-pressed')==='true');selectedButton?.focus();});
        card.append(image,heading,description,requirement,button);target.append(card);
      }
    }
    const rows=distribution(save), rarities={}, categories={};
    rows.forEach(({item,probability})=>{rarities[item.rarity]=(rarities[item.rarity]||0)+probability;categories[item.category]=(categories[item.category]||0)+probability;});
    const content=$('#odds-content');content.replaceChildren();
    for(const [title,data] of [['rarity',rarities],['kind of catch',categories]]) {
      const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent=title;table.append(caption);
      for(const [name,chance] of Object.entries(data)) {const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=name;td.textContent=`${(chance*100).toFixed(1)}%`;tr.append(th,td);table.append(tr);}
      content.append(table);
    }
  }
  stats();onState('idle');syncPause();
  let last=performance.now(),meterValue=-1;
  function frame(now) {
    const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    if(!document.hidden&&!manualPaused&&!$('dialog[open]')) time+=dt;
    game.update(dt);
    if(view==='fish') {
      renderer.dock(game,save,time,reduced.matches);
      if(game.state==='timing') {
        $('#target-zone').style.left=`${game.target*100}%`;
        $('#target-zone').style.width=`${game.width*100}%`;
        $('#marker').style.left=`${game.marker*100}%`;
        const inside=game.marker>=game.target&&game.marker<=game.target+game.width;
        const perfect=inside&&game.marker>=game.target+game.width*.34&&game.marker<=game.target+game.width*.66;
        $('#timing-cue').textContent=perfect?'perfect pull!':inside?'pull now!':'keep going';
        const value=Math.round(game.marker*100);
        if(value!==meterValue) {meterValue=value;$('#meter').setAttribute('aria-valuenow',String(value));$('#meter').setAttribute('aria-valuetext',`${value} percent, ${perfect?'perfect pull':inside?'inside target':'outside target'}`);}
      }
    } else if(view==='aquarium') renderer.tank(save,time,reduced.matches);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
