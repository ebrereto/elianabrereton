import { catches, spriteURL, living, totalCaught } from './catches.js';

const INK = '#263f50';
const CREAM = '#fff5dc';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('a fishing image could not load. please refresh.'));
  image.src = src;
});

export async function loadArt() {
  const images = await Promise.all(catches.map(item => loadImage(spriteURL(item.id))));
  return {
    base: await loadImage(spriteURL('dock-base')),
    sprites: Object.fromEntries(catches.map((item, index) => [item.id, images[index]]))
  };
}

function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

// Bresenham lines keep every moving detail on the pixel grid.
function line(ctx, x0, y0, x1, y1, color, thickness = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    rect(ctx, x0, y0, thickness, thickness, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * error;
    if (e2 >= dy) { error += dy; x0 += sx; }
    if (e2 <= dx) { error += dx; y0 += sy; }
  }
}

function curve(ctx, x0, y0, cx, cy, x1, y1, color) {
  let previousX = x0, previousY = y0;
  for (let index = 1; index <= 20; index++) {
    const t = index / 20, inverse = 1 - t;
    const x = inverse * inverse * x0 + 2 * inverse * t * cx + t * t * x1;
    const y = inverse * inverse * y0 + 2 * inverse * t * cy + t * t * y1;
    line(ctx, previousX, previousY, x, y, color);
    previousX = x; previousY = y;
  }
}

function rgb(color) {
  if (color.startsWith('rgb')) return color.match(/[\d.]+/g).slice(0, 3).map(Number);
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(from, to, amount) {
  const a = rgb(from), b = rgb(to);
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * amount)).join(',')})`;
}

function cloud(ctx, x, y, scale, light, shade) {
  rect(ctx, x, y + 5 * scale, 32 * scale, 6 * scale, shade);
  rect(ctx, x + 4 * scale, y + 2 * scale, 24 * scale, 7 * scale, light);
  rect(ctx, x + 10 * scale, y, 12 * scale, 8 * scale, light);
  rect(ctx, x + 2 * scale, y + 8 * scale, 24 * scale, 2 * scale, light);
}

function waves(ctx, y, color, spacing, speed, time, height = 1) {
  const offset = (time * speed) % spacing;
  for (let x = -spacing; x < 400; x += spacing) {
    rect(ctx, x + offset, y + ((x / spacing) % 2 ? 2 : 0), spacing * .56, height, color);
  }
}

function fishShadow(ctx, x, y, color, flip = false) {
  rect(ctx, x, y, 14, 4, color);
  rect(ctx, x + 3, y - 2, 8, 2, color);
  rect(ctx, x + 3, y + 4, 8, 1, color);
  const tail = flip ? x + 13 : x - 4;
  rect(ctx, tail, y - 1, 4, 6, color);
}

function drawDock(ctx) {
  // Deep contact shadows make the dock feel like a foreground platform.
  rect(ctx, 62, 171, 249, 45, '#263f50');
  rect(ctx, 68, 169, 238, 47, '#8d5f49');
  rect(ctx, 73, 169, 228, 47, '#b9805d');
  rect(ctx, 73, 170, 228, 3, '#d9aa78');

  for (const [y, width, x] of [[178, 205, 88], [187, 214, 83], [197, 224, 78], [208, 235, 72]]) {
    rect(ctx, x, y, width, 2, '#754b3d');
    rect(ctx, x, y + 2, width, 1, '#d39a6e');
  }
  for (const [x, y] of [[104,174],[148,183],[259,174],[201,194],[92,203],[280,205]]) {
    rect(ctx, x, y, 3, 2, '#5e4038');
    rect(ctx, x + 1, y, 1, 1, '#263f50');
  }

  // Posts, rope, barnacles, and edge highlights.
  rect(ctx, 88, 154, 12, 48, '#263f50'); rect(ctx, 91, 151, 7, 47, '#c79266');
  rect(ctx, 267, 154, 12, 48, '#263f50'); rect(ctx, 270, 151, 7, 47, '#c79266');
  rect(ctx, 88, 151, 12, 4, CREAM); rect(ctx, 267, 151, 12, 4, CREAM);
  curve(ctx, 98, 159, 183, 181, 270, 159, '#6b4a3d');
  for (const [x, y] of [[89,176],[94,185],[268,172],[272,188]]) {
    rect(ctx, x, y, 3, 2, '#e8d6b7'); rect(ctx, x + 1, y - 1, 2, 1, '#8aa69d');
  }

  // Bucket and tackle box with stronger offset shadows.
  rect(ctx, 116, 186, 19, 19, '#263f50');
  rect(ctx, 118, 183, 16, 18, '#6d9eb8');
  rect(ctx, 119, 184, 14, 3, '#a8cad1');
  rect(ctx, 120, 181, 12, 2, CREAM);
  line(ctx, 119, 183, 117, 177, '#263f50'); line(ctx, 132, 183, 134, 177, '#263f50');

  rect(ctx, 239, 199, 24, 10, '#263f50');
  rect(ctx, 237, 196, 24, 9, '#4b9b91');
  rect(ctx, 239, 197, 20, 2, '#80c5ae');
  rect(ctx, 245, 193, 9, 3, '#263f50');
  rect(ctx, 248, 198, 3, 3, '#f0c36d');

  // The near edge anchors the player's point of view.
  rect(ctx, 64, 212, 246, 4, '#263f50');
  rect(ctx, 76, 210, 220, 2, '#e0ac78');
}

export class Renderer {
  constructor(canvas, aquarium, art) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.aquarium = aquarium;
    this.aq = aquarium.getContext('2d');
    this.art = art;
    this.tankFish = [];
    this.pet = null;
    this.ctx.imageSmoothingEnabled = this.aq.imageSmoothingEnabled = false;
  }

  scene(ctx, time, reduced) {
    const t = reduced ? 0 : time;
    // Day reaches evening after eight minutes, then drifts back toward day.
    const dusk = (1 - Math.cos(((time % 960) / 960) * Math.PI * 2)) / 2;
    const skyTop = mix('#9fdce6', '#715d8f', dusk);
    const skyBottom = mix('#f4dcae', '#e69a8a', dusk);
    for (let band = 0; band < 13; band++) rect(ctx, 0, band * 6, 384, 7, mix(skyTop, skyBottom, band / 12));

    const sunX = 315 - dusk * 120, sunY = 22 + dusk * 35;
    rect(ctx, sunX, sunY, 12, 12, mix('#fff2a9', '#ffd0a2', dusk));
    rect(ctx, sunX + 2, sunY - 2, 8, 16, mix('#fff7ca', '#f7b6b4', dusk));
    if (dusk > .58) {
      const star = mix('#e9e5d4', '#fff5dc', dusk);
      for (const [x, y] of [[24,18],[89,31],[151,13],[225,27],[351,18]]) rect(ctx, x, y, 2, 2, star);
    }

    const cloudLight = mix('#f8f1dc', '#e8c3cf', dusk);
    const cloudShade = mix('#c9d9d6', '#ab819f', dusk);
    cloud(ctx, ((28 + t * .7) % 450) - 45, 21, 1, cloudLight, cloudShade);
    cloud(ctx, ((182 + t * .38) % 470) - 55, 38, .72, cloudLight, cloudShade);
    cloud(ctx, ((332 + t * .52) % 480) - 55, 12, .86, cloudLight, cloudShade);

    // Distant shoreline and a small boat make the horizon feel inhabited.
    rect(ctx, 0, 72, 384, 7, mix('#779b8b', '#635f79', dusk));
    for (let x = 0; x < 390; x += 31) rect(ctx, x, 67 + (x % 4), 22, 8, mix('#8eb29d', '#70677a', dusk));
    const boatX = ((t * .75 + 250) % 455) - 35;
    rect(ctx, boatX, 76, 18, 2, '#4a5260'); rect(ctx, boatX + 4, 73, 10, 3, '#cf806f');
    line(ctx, boatX + 9, 73, boatX + 9, 65, '#4a5260');
    rect(ctx, boatX + 10, 66, 7, 5, CREAM);

    const waterFar = mix('#6abfc3', '#6d809e', dusk);
    const waterMid = mix('#4eaeb5', '#526f91', dusk);
    const waterNear = mix('#3f97a5', '#405d7e', dusk);
    rect(ctx, 0, 79, 384, 30, waterFar);
    rect(ctx, 0, 109, 384, 31, waterMid);
    rect(ctx, 0, 140, 384, 76, waterNear);
    waves(ctx, 86, mix('#bce8df', '#b9b2cf', dusk), 38, .8, t);
    waves(ctx, 102, mix('#8fd6d1', '#8b9fbd', dusk), 29, 1.45, t);
    waves(ctx, 119, mix('#88d2cd', '#7f94b4', dusk), 23, 2.3, t, 2);
    waves(ctx, 145, mix('#75c8c4', '#7188aa', dusk), 17, 3.6, t);
    waves(ctx, 160, mix('#9ddbd1', '#8494b3', dusk), 13, 5.2, t);

    // Floating leaves and occasional silhouettes pass under the surface.
    for (let index = 0; index < 4; index++) {
      const x = (index * 101 + t * (1.2 + index * .2)) % 410 - 12;
      const y = 104 + index * 13 + Math.sin(t * .5 + index) * 2;
      rect(ctx, x, y, 5, 2, index % 2 ? '#547f72' : '#688a65');
      rect(ctx, x + 1, y - 1, 3, 1, '#91ad75');
    }
    if (!reduced) {
      const pass = time % 14;
      if (pass > 6 && pass < 11) fishShadow(ctx, (pass - 6) * 88 - 28, 128 + Math.sin(time) * 3, mix('#347c86', '#384f70', dusk));
    }

    // Seaweed and wavelets lap against the dock edge.
    for (let index = 0; index < 6; index++) {
      const x = 55 + index * 52;
      line(ctx, x, 170, x + Math.sin(t * 1.2 + index) * 3, 158 - (index % 3) * 3, index % 2 ? '#387e72' : '#356c67', 2);
    }
    waves(ctx, 166, '#b4e3d6', 19, 6.2, t, 2);

    if (!reduced) {
      const birdX = (time * 4.2 + 160) % 440 - 20;
      for (let index = 0; index < 2; index++) {
        const y = 38 + index * 8 + Math.sin(time * 1.4 + index) * 2;
        line(ctx, birdX + index * 15, y, birdX + 4 + index * 15, y + 2, INK);
        line(ctx, birdX + 4 + index * 15, y + 2, birdX + 8 + index * 15, y, INK);
      }
    }

    drawDock(ctx);
  }

  dock(game, save, time, reduced) {
    const ctx = this.ctx, state = game.state, t = reduced ? 0 : time;
    ctx.clearRect(0, 0, 384, 216);
    ctx.save();
    if (!reduced && state === 'bite' && game.elapsed < .24) ctx.translate(Math.sin(game.elapsed * 95) * 2, game.elapsed < .12 ? 1 : 0);
    this.scene(ctx, time, reduced);

    let tipX = 180, tipY = 106, bobX = 176, bobY = 141 + Math.sin(t * 2.5) * .7;
    if (state === 'casting') {
      const progress = Math.min(1, game.elapsed / .9);
      tipX = 180 - Math.sin(progress * Math.PI) * 22;
      tipY = 106 - Math.sin(progress * Math.PI) * 27;
      bobX = 229 + (176 - 229) * progress;
      bobY = 184 + (141 - 184) * progress - Math.sin(progress * Math.PI) * 64;
    }
    if (state === 'waiting' && game.wait - game.elapsed < 1.1) {
      const suspicion = 1 - clamp((game.wait - game.elapsed) / 1.1, 0, 1);
      bobX += Math.sin(t * 13) * suspicion * 2;
      bobY += Math.sin(t * 19) * suspicion * 2.3;
    }
    if (state === 'bite') {
      const plunge = clamp(game.elapsed / .22, 0, 1);
      bobX += Math.sin(t * 28) * 2;
      bobY = 141 + plunge * 11 + Math.sin(t * 21) * (1 - plunge) * 2;
      tipX -= 8 + Math.sin(t * 14) * 3;
      tipY += 4;
    }
    if (state === 'timing') {
      const strain = 2 + (3 - (game.lineStrength || 3)) * 2;
      tipX -= strain + Math.sin(t * 8) * 2;
      tipY += 3;
      bobX += Math.sin(t * 6) * 3;
      bobY += Math.sin(t * 7) * 2;
    }
    if (state === 'reeling') {
      const progress = Math.min(1, game.elapsed / 1.05);
      bobX = 176 + 55 * progress;
      bobY = 141 + 40 * progress - Math.sin(progress * Math.PI) * 34;
      tipX -= Math.sin(progress * Math.PI) * (game.success ? 17 : 9);
      tipY += Math.sin(progress * Math.PI) * 5;
    }

    const deployed = ['casting', 'waiting', 'bite', 'timing', 'reeling'].includes(state);
    if (deployed) {
      const rippleAge = state === 'waiting' ? game.elapsed : state === 'bite' ? game.elapsed : 2;
      if (rippleAge < .9) {
        const spread = 8 + rippleAge * 17;
        rect(ctx, bobX - spread, bobY + 6, spread * 2, 1, '#b8e4dc');
        rect(ctx, bobX - spread * .65, bobY + 9, spread * 1.3, 1, '#83cbc7');
      }
      if (state === 'bite') {
        for (let index = 0; index < 8; index++) {
          rect(ctx, bobX - 13 + index * 4, bobY - 5 - Math.sin(t * 14 + index) * 4, 2, 2, index % 2 ? CREAM : '#b4e3d6');
        }
      }

      const controlX = state === 'casting' ? 142 : (tipX + bobX) / 2 - 9;
      const controlY = state === 'casting' ? Math.min(tipY, bobY) - 27 : (tipY + bobY) / 2 - 5;
      curve(ctx, tipX, tipY, controlX, controlY, bobX, bobY, CREAM);

      if (!(state === 'reeling' && game.success)) {
        rect(ctx, bobX - 3, bobY - 3, 6, 7, INK);
        rect(ctx, bobX - 2, bobY - 4, 4, 4, '#ee8d82');
        rect(ctx, bobX - 2, bobY, 4, 3, CREAM);
      }
    } else {
      curve(ctx, tipX, tipY, tipX - 8, 118, tipX - 2, 128, CREAM);
      rect(ctx, tipX - 4, 126, 4, 4, '#ee8d82'); rect(ctx, tipX - 4, 130, 4, 3, CREAM);
    }

    if (['bite', 'timing'].includes(state)) {
      const shadowX = bobX - 10 + Math.sin(t * 3) * 7;
      fishShadow(ctx, shadowX, bobY + 18, '#397d88', Math.sin(t) > 0);
    }

    if (state === 'reeling' && game.success && game.item) {
      const progress = Math.min(1, game.elapsed / 1.05);
      const fishX = 168 + 65 * progress;
      const fishY = 145 - Math.sin(progress * Math.PI) * 58 + progress * 22;
      curve(ctx, tipX, tipY, (tipX + fishX) / 2, fishY - 12, fishX + 16, fishY + 10, CREAM);
      ctx.drawImage(this.art.sprites[game.item.id], Math.round(fishX), Math.round(fishY), 32, 32);
      for (let index = 0; index < 6; index++) rect(ctx, 170 + index * 5, 146 - Math.sin(progress * 15 + index) * 5, 2, 2, '#b4e3d6');
    }

    if ((state === 'escaped' || (state === 'reeling' && !game.success)) && game.elapsed < 1.2) {
      for (let index = 0; index < 7; index++) {
        const rise = game.elapsed * (10 + index);
        rect(ctx, 171 + index * 4, 151 - rise - (index % 2) * 4, 2, 2, index % 2 ? CREAM : '#9ed9d3');
      }
      rect(ctx, 161 - game.elapsed * 8, 145, 11 + game.elapsed * 16, 1, '#b4e3d6');
      rect(ctx, 181 - game.elapsed * 4, 149, 9 + game.elapsed * 10, 1, '#83cbc7');
    }

    const rodColor = { driftwood: '#efc46f', 'sea-glass': '#62bfb3', ribbon: '#ee8d82' }[save.rod];
    const bend = ['bite', 'timing', 'reeling'].includes(state) ? 5 : 0;
    line(ctx, 239, 216, 214, 172, INK, 4);
    line(ctx, 214, 172, 198 - bend, 132, INK, 3);
    line(ctx, 198 - bend, 132, tipX, tipY, INK, 2);
    line(ctx, 240, 216, 215, 172, rodColor, 2);
    line(ctx, 215, 172, 199 - bend, 132, rodColor);
    line(ctx, 199 - bend, 132, tipX + 1, tipY, rodColor);
    line(ctx, 234, 202, 240, 212, CREAM, 3);
    rect(ctx, 228, 203, 5, 6, INK); rect(ctx, 229, 204, 3, 3, rodColor);

    if (state === 'caught' && game.item && ['rare', 'secret'].includes(game.item.rarity) && !reduced && game.elapsed < .65) {
      ctx.globalAlpha = Math.max(0, .22 - game.elapsed * .3);
      rect(ctx, 0, 0, 384, 216, game.item.rarity === 'secret' ? '#f5d7ff' : '#ffe2ad');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  tank(save, time, reduced) {
    const ctx = this.aq, t = reduced ? 0 : time, caught = totalCaught(save);
    const habitat = 1 + [3,7,12].filter(mark=>caught>=mark).length;
    rect(ctx, 0, 0, 384, 180, '#cde8df'); rect(ctx, 0, 20, 384, 145, '#78bfbe'); rect(ctx, 0, 83, 384, 82, '#5da6ae');
    // Slow, stepped light rays give the glass some depth without losing the pixel style.
    ctx.globalAlpha = .13;
    for (let ray=0;ray<4;ray++) for(let step=0;step<8;step++) rect(ctx, 35+ray*102+step*4+(reduced?0:Math.sin(t*.18+ray)*5),20+step*16,24-step*2,18,'#fff9d9');
    ctx.globalAlpha = 1;
    for (let index = 0; index < 11; index++) rect(ctx, index * 37 + ((t*.25)%37), 9, 23, 1, '#f5f2d8');

    // A rocky, collectible habitat that grows with the player's total catches.
    rect(ctx,0,158,384,22,'#c3ae87');rect(ctx,0,164,384,16,'#dfcea5');
    for(const [x,y,w,c] of [[5,156,24,'#789896'],[31,162,18,'#9ea58f'],[61,154,28,'#708d8b'],[98,160,16,'#ad9b80'],[126,155,31,'#6e8b8b'],[165,162,24,'#a99a80'],[205,155,26,'#668587'],[243,161,20,'#9c967f'],[276,153,30,'#708d88'],[315,160,18,'#a7957b'],[344,155,34,'#688588']]) {
      rect(ctx,x,y,w,180-y,c);rect(ctx,x+3,y-3,Math.max(5,w-8),4,mix(c,'#e7dfc1',.35));
    }
    for (let index = 0; index < (habitat+2); index++) {
      const x = 18 + index * (330/(habitat+1));
      for (let segment = 0; segment < 6; segment++) rect(ctx, x + Math.sin(segment + t*.7+index) * 2, 160 - segment * 7, 3, 9, index % 2 ? '#397f78' : '#4a9080');
    }
    // Shells arrive first, then driftwood, then the tiny treasure chest.
    if(habitat>=2){rect(ctx,48,156,8,5,'#f0d3c0');rect(ctx,50,153,4,4,'#dc9e9f');rect(ctx,328,158,7,4,'#e8d4aa');}
    if(habitat>=3){line(ctx,238,158,292,143,'#6c4d3f',6);line(ctx,250,153,238,141,'#6c4d3f',4);rect(ctx,273,145,10,3,'#926753');}
    if(habitat>=4){rect(ctx,105,145,28,16,'#59453d');rect(ctx,107,148,24,12,'#b06f4e');rect(ctx,107,148,24,3,'#e1a368');rect(ctx,117,148,4,12,'#f0c36d');rect(ctx,105,143,28,4,'#59453d');}

    for (let index = 0; index < 9; index++) {
      const x = 20 + index * 43, y = 151 - ((t * (6 + index % 4) + index * 17) % 125);
      rect(ctx, x, y, 2, 1, '#d7eee4'); rect(ctx, x - 1, y + 1, 1, 2, '#d7eee4'); rect(ctx, x + 2, y + 1, 1, 2, '#d7eee4'); rect(ctx, x, y + 3, 2, 1, '#d7eee4');
    }
    const entries = catches.filter(item => living(item) && save.collection[item.id]);
    this.tankFish = [];
    if(!entries.length){
      // The empty tank still has one shy resident.
      const snailX=172+(reduced?0:Math.sin(t*.35)*12);rect(ctx,snailX,147,12,8,'#d6878f');rect(ctx,snailX+3,143,9,9,'#ecb18e');rect(ctx,snailX+5,145,4,4,'#d06e80');rect(ctx,snailX+12,151,11,4,'#6e837f');rect(ctx,snailX+20,147,2,5,'#6e837f');rect(ctx,snailX+18,145,2,2,INK);
    }
    let spriteIndex = 0;
    entries.forEach(item => {
      const count = Math.min(save.collection[item.id].count, 3);
      for (let number = 0; number < count; number++) {
        const index = spriteIndex++, profile=(catches.indexOf(item)+number)%6, period = 680;
        const sleepy=!reduced&&((Math.floor((t+index*4)/14)+index)%11===0), speed=sleepy ? .65 : [5.1,6.2,7.5,4.4,8.1,5.7][profile];
        const travel = ((t * speed + index * 79) % period), right = travel < 340;
        let x = right ? travel : 680 - travel, y = 25 + (index * 29 + profile*7) % 104;
        if(!reduced){y+=Math.sin(t*(.8+profile*.14)+index)*[2,4,3,5,2,3][profile];if(profile===2)y+=Math.sin(t*2.8)*2;}
        const drawX = Math.round(x), drawY = Math.round(y), pulse=reduced?1:1+Math.sin(t*3+index)*([.02,.03,.05,.02,.04,.025][profile]);
        this.tankFish.push({ index, item, x: drawX, y: drawY, width: 32, height: 32 });
        if(['rare','secret'].includes(item.rarity)){const glow=8+Math.round(Math.sin(t*2+index)*3);ctx.globalAlpha=.28;rect(ctx,drawX+glow,drawY-3,2,2,item.rarity==='secret'?'#fff2a9':'#f3c0dd');rect(ctx,drawX+26-glow/2,drawY+31,2,2,'#fff5dc');ctx.globalAlpha=1;}
        ctx.save(); ctx.translate(drawX + (right ? 0 : 32), drawY+16); ctx.scale((right ? 1 : -1)*pulse,1/pulse);ctx.translate(0,-16);ctx.drawImage(this.art.sprites[item.id],0,0,32,32);ctx.restore();
        if(sleepy){rect(ctx,drawX+25,drawY-3,4,2,CREAM);rect(ctx,drawX+28,drawY-6,5,2,CREAM);}
      }
    });
    if (this.pet && time < this.pet.until) {
      const friend = this.tankFish.find(fish => fish.index === this.pet.index);
      if (friend) {
        const bob = reduced ? 0 : Math.sin((this.pet.until - time) * 9) * 2;
        const bubbleX = clamp(friend.x + 8, 4, 356), bubbleY = Math.max(5, friend.y - 22 + bob);
        rect(ctx, bubbleX, bubbleY, 23, 17, INK);
        rect(ctx, bubbleX + 2, bubbleY + 2, 19, 12, CREAM);
        rect(ctx, bubbleX + 7, bubbleY + 16, 4, 3, INK);
        rect(ctx, bubbleX + 8, bubbleY + 14, 3, 3, CREAM);
        rect(ctx, bubbleX + 6, bubbleY + 5, 4, 4, '#d9688e');
        rect(ctx, bubbleX + 12, bubbleY + 5, 4, 4, '#d9688e');
        rect(ctx, bubbleX + 8, bubbleY + 7, 6, 5, '#d9688e');
        rect(ctx, bubbleX + 10, bubbleY + 12, 2, 2, '#d9688e');
      }
    } else if (this.pet) this.pet = null;
  }

  petAquarium(x, y, time) {
    const friend = [...this.tankFish].reverse().find(fish => x >= fish.x - 4 && x <= fish.x + fish.width + 4 && y >= fish.y - 4 && y <= fish.y + fish.height + 4);
    if (!friend) return null;
    this.pet = { index: friend.index, until: time + 1.15 };
    return friend.item;
  }
}
