const url = new URL('../../assets/fishing/catches.json', import.meta.url);
export const catches = await fetch(url).then(response => {
  if (!response.ok) throw new Error('The catch collection could not load. Please refresh.');
  return response.json();
});
export const byId = Object.fromEntries(catches.map(item => [item.id, item]));
export const spriteURL = id => new URL(`../../assets/fishing/${id}.svg`, import.meta.url).href;
export const living = item => item.category === 'fish' || item.category === 'creature';

export const rods = [
  { id: 'driftwood', name: 'driftwood rod', description: 'a trusty little stick. yours from the start.', price: 0, width: 0, speed: 1, icon: '🪄' },
  { id: 'sea-glass', name: 'sea glass rod', description: 'a wider target. a little room to breathe.', price: 38, width: .07, speed: 1, icon: '🫧' },
  { id: 'ribbon', name: 'ribbon rod', description: 'a slower marker, tied with a faded pink bow.', price: 72, width: 0, speed: .78, icon: '🎀' },
  { id: 'sunset', name: 'sunset rod', description: 'warm as the last light. slightly wider and calmer.', price: 110, width: .045, speed: .86, icon: '🌅' },
  { id: 'moon-thread', name: 'moon-thread rod', description: 'silver line for patient night fishing.', price: 165, width: .03, speed: .7, icon: '🌙' }
];
export const baits = [
  { id: 'crumbs', name: 'plain crumbs', description: 'a little of everything.', price: 0, icon: '🍞' },
  { id: 'seaweed', name: 'seaweed bites', description: 'more swimming friends, less junk.', price: 20, icon: '🌿' },
  { id: 'sparkle', name: 'sparkle crumbs', description: 'more magical creatures and treasure.', price: 45, icon: '✨' },
  { id: 'lucky-biscuit', name: 'lucky biscuit', description: 'billy swears the rare ones can smell it.', price: 70, icon: '🍪' }
];
export const bobbers = [
  { id:'classic', name:'classic bobber', description:'red, cream, reliable.', price:0, icon:'◉' },
  { id:'cherry', name:'cherry bobber', description:'two tiny cherries bobbing together.', price:18, icon:'🍒' },
  { id:'mushroom', name:'mushroom bobber', description:'a very small toadstool with a job.', price:24, icon:'🍄' },
  { id:'moon', name:'moon bobber', description:'a pale crescent that glows at dusk.', price:36, icon:'🌙' }
];
export const decorations = [
  { id:'pink-tackle-box', name:'pink tackle box', description:'a rosy little box for the dock.', price:32, place:'dock', icon:'🧰' },
  { id:'dock-lantern', name:'dock lantern', description:'a warm glow beside the water.', price:48, place:'dock', icon:'🏮' },
  { id:'pennants', name:'weathered pennants', description:'tiny flags that dance in the salt air.', price:42, place:'dock', icon:'🎏' },
  { id:'potted-plant', name:'dockside fern', description:'billy says it enjoys sea spray.', price:28, place:'dock', icon:'🪴' },
  { id:'bubble-lamp', name:'bubble lamp', description:'soft light and an endless trail of bubbles.', price:54, place:'aquarium', icon:'🫧' },
  { id:'shell-arch', name:'shell arch', description:'a dreamy doorway for tiny swimmers.', price:46, place:'aquarium', icon:'🐚' },
  { id:'tiny-castle', name:'tiny castle', description:'a grand home for a very small monarch.', price:60, place:'aquarium', icon:'🏰' },
  { id:'pink-coral', name:'pink coral garden', description:'a gentle jewel-toned reef.', price:38, place:'aquarium', icon:'🪸' }
];
export const shopItems = [
  ...rods.map(item=>({...item,type:'rod'})), ...baits.map(item=>({...item,type:'bait'})),
  ...bobbers.map(item=>({...item,type:'bobber'})), ...decorations.map(item=>({...item,type:'decor'}))
];
export const totalCaught = save => Object.values(save.collection).reduce((sum, entry) => sum + entry.count, 0);
export const discoveries = save => Object.keys(save.collection).length;
export const rodUnlocked = (rod, save) => save.owned?.includes(rod.id) || rod.price === 0;
export const baitUnlocked = (bait, save) => save.owned?.includes(bait.id) || bait.price === 0;

// Normalize individual weights so a rarity's population does not distort its share.
export function distribution(save) {
  const available = catches.filter(item => item.id !== 'pearl-with-a-view' || discoveries(save) >= 8);
  const tiers = { common: 55, uncommon: 27, rare: 13, secret: 5 };
  if (save.dryStreak >= 10) { tiers.common -= 8; tiers.rare += 4; tiers.secret += 4; }
  const counts = {};
  available.forEach(item => { counts[item.rarity] = (counts[item.rarity] || 0) + 1; });
  const rows = available.map(item => {
    let weight = tiers[item.rarity] / counts[item.rarity];
    if (save.bait === 'seaweed') weight *= living(item) ? 1.6 : item.category === 'junk' ? .45 : 1;
    if (save.bait === 'sparkle') weight *= item.category === 'creature' || item.category === 'treasure' ? 1.9 : 1;
    if (save.bait === 'lucky-biscuit') weight *= ['rare','secret'].includes(item.rarity) ? 1.38 : 1;
    return { item, weight };
  });
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  return rows.map(row => ({ item: row.item, probability: row.weight / total }));
}
export function chooseCatch(save, random = Math.random) {
  const rows = distribution(save);
  let roll = random();
  for (const row of rows) { roll -= row.probability; if (roll < 0) return row.item; }
  return rows.at(-1).item;
}
export function catchSize(item, random = Math.random) {
  if (!living(item)) return null;
  const ranges = { sardine: [8, 22], anchovy: [6, 16], 'sand-goby': [3, 10], flounder: [12, 38], mackerel: [18, 43], clownfish: [4, 12], pufferfish: [8, 25], seahorse: [5, 18], moonfish: [25, 70], 'flying-fish': [12, 32] };
  const [min, max] = ranges[item.id] || [4, 28];
  return Math.round((min + random() * (max - min)) * 10) / 10;
}
