import { shopItems } from './catches.js';

export const billyLines = [
  "oh. it's you. i've seen you 'round the beach. catch anything good?",
  'meow meow meow. ahem - sorry, i meant, what can i do for ya?',
  'hey there sailor! better have brought me a nice fish flavoured tip!',
  'found some good stuff out there today. you should really have a look',
  'the tide brought in some cool stuff this morning. lucky for you, i got there first.',
  'fresh stock, fair prices, and absolutely no haggling. unless you’ve got sardines. then we can haggle.',
  "if you’re heading back out, don't forget to bring your sea legs with you.",
  "i had a nap planned, but i guess i'll sell you stuff now."
];
export const everydayIds = ['seaweed','sparkle','sea-glass','ribbon','cherry','mushroom'];
const dailyIds = ['lucky-biscuit','sunset','moon-thread','moon','pink-tackle-box','dock-lantern','pennants','potted-plant','bubble-lamp','shell-arch','tiny-castle','pink-coral'];
export const itemById = Object.fromEntries(shopItems.map(item=>[item.id,item]));
export const owned = (save,id) => save.owned.includes(id);
export const dailyStock = (date = new Date()) => {
  const key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
  let seed = [...key].reduce((n,char)=>(n*31+char.charCodeAt(0))>>>0,2166136261);
  const pool=[...dailyIds];
  for(let i=pool.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,4).map(id=>itemById[id]);
};
export function coinReward(item,{first=false,sizeRecord=false,perfect=false}={},random=Math.random){
  const ranges={common:[3,4],uncommon:[6,8],rare:[12,15],secret:[22,28]};
  const [low,high]=item.category==='junk'?[1,2]:(ranges[item.rarity]||[3,4]);
  return low+Math.floor(random()*(high-low+1))+(first?5:0)+(sizeRecord?3:0)+(perfect?3:0);
}
export function buy(save,id){
  const item=itemById[id];
  if(!item||owned(save,id)||save.coins<item.price)return false;
  save.coins-=item.price;save.owned.push(id);
  if(item.type==='decor')save.placedDecor.push(id);
  return true;
}
export function toggleDecor(save,id){
  if(!owned(save,id)||itemById[id]?.type!=='decor')return false;
  save.placedDecor=save.placedDecor.includes(id)?save.placedDecor.filter(value=>value!==id):[...save.placedDecor,id];return true;
}
