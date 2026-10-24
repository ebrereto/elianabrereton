import { chooseCatch, rods } from './catches.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const HEAVY = new Set(['flounder', 'moonfish', 'ribbon-ray']);
const FAST = new Set(['anchovy', 'mackerel', 'flying-fish']);

export class FishingGame {
  constructor(getSave, onChange, random = Math.random) {
    this.getSave = getSave;
    this.onChange = onChange;
    this.random = random;
    this.state = 'idle';
    this.elapsed = 0;
    this.marker = 0;
    this.paused = false;
    this.lineStrength = 3;
    this.perfects = 0;
  }

  transition(state) {
    this.state = state;
    this.elapsed = 0;
    this.onChange(state, this);
  }

  reset() {
    this.item = null;
    this.lastResult = null;
    this.transition('idle');
  }

  fightProfile() {
    const item = this.item;
    if (item.category === 'treasure') return { rounds: 0, behavior: 'treasure', width: -.08, speed: .78 };
    if (item.category === 'junk') return { rounds: 1, behavior: 'junk', width: .18, speed: .72 };
    if (HEAVY.has(item.id)) return { rounds: 3, behavior: 'heavy', width: .03, speed: .76 };
    if (FAST.has(item.id)) return { rounds: item.rarity === 'common' ? 2 : 3, behavior: 'fast', width: -.06, speed: 1.22 };
    if (item.category === 'creature' && ['rare', 'secret'].includes(item.rarity)) return { rounds: 3, behavior: 'magic', width: -.04, speed: .9 };
    return { rounds: item.rarity === 'common' ? 2 : 3, behavior: 'steady', width: item.rarity === 'common' ? .06 : 0, speed: 1 };
  }

  configureRound(save) {
    const rod = rods.find(candidate => candidate.id === save.rod) || rods[0];
    const rarityWidth = { common: .34, uncommon: .29, rare: .24, secret: .21 }[this.item.rarity];
    const raritySpeed = { common: .5, uncommon: .56, rare: .62, secret: .67 }[this.item.rarity];
    let width = rarityWidth + rod.width + this.profile.width;
    let speed = raritySpeed * rod.speed * this.profile.speed;

    if (this.phase === 'land') {
      width += this.profile.behavior === 'treasure' ? 0 : .11;
      speed *= this.profile.behavior === 'treasure' ? .8 : .84;
    }

    this.width = clamp(width, .13, .56);
    this.speed = clamp(speed, .28, .95);
    this.target = .09 + this.random() * (1 - this.width - .18);
    this.marker = 0;
    this.targetStep = 0;
  }

  beginFight(save) {
    this.profile = this.fightProfile();
    this.behavior = this.profile.behavior;
    this.fightTotal = this.profile.rounds;
    this.fightRound = this.fightTotal ? 1 : 0;
    this.phase = this.fightTotal ? 'fight' : 'land';
    this.lineStrength = 3;
    this.perfects = 0;
    this.lastResult = null;
    this.configureRound(save);
  }

  action() {
    if (this.paused) return;
    const save = this.getSave();

    if (['idle', 'caught', 'escaped'].includes(this.state)) {
      this.item = chooseCatch(save, this.random);
      this.wait = 1.8 + this.random() * 2.6;
      this.transition('casting');
      return;
    }

    if (this.state === 'bite') {
      this.beginFight(save);
      this.transition('timing');
      return;
    }

    if (this.state !== 'timing') return;

    const inside = this.marker >= this.target && this.marker <= this.target + this.width;
    const perfectStart = this.target + this.width * .34;
    const perfectEnd = this.target + this.width * .66;
    const perfect = inside && this.marker >= perfectStart && this.marker <= perfectEnd;
    this.lastResult = perfect ? 'perfect' : inside ? 'hit' : 'miss';

    if (perfect) {
      this.perfects++;
      this.lineStrength = Math.min(3, this.lineStrength + 1);
    } else if (!inside) {
      this.lineStrength--;
    }

    if (this.lineStrength <= 0) {
      this.success = false;
      this.reason = 'line';
      this.transition('reeling');
      return;
    }

    if (this.phase === 'fight') {
      if (this.fightRound < this.fightTotal) {
        this.fightRound++;
      } else {
        this.phase = 'land';
      }
      this.configureRound(save);
      this.elapsed = 0;
      this.onChange('timing', this);
      return;
    }

    this.success = inside;
    if (!inside) this.reason = 'land';
    this.transition('reeling');
  }

  update(dt) {
    if (this.paused) return;
    this.elapsed += dt;

    switch (this.state) {
      case 'casting':
        if (this.elapsed >= .9) this.transition('waiting');
        break;
      case 'waiting':
        if (this.elapsed >= this.wait) this.transition('bite');
        break;
      case 'bite':
        if (this.elapsed >= 3.2) {
          this.reason = 'bite';
          this.transition('escaped');
        }
        break;
      case 'timing': {
        const cycle = (this.elapsed * this.speed) % 2;
        this.marker = cycle <= 1 ? cycle : 2 - cycle;
        if (this.behavior === 'magic' && this.phase === 'fight') {
          const step = Math.floor(this.elapsed / .82);
          if (step > this.targetStep) {
            this.targetStep = step;
            this.target = .09 + this.random() * (1 - this.width - .18);
          }
        }
        break;
      }
      case 'reeling':
        if (this.elapsed >= 1.05) this.transition(this.success ? 'caught' : 'escaped');
        break;
    }
  }
}
