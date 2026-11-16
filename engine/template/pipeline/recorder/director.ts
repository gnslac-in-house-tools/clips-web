import type { Locator, Page } from 'playwright';
import type { MousePoint, RecEvent, Recording, Rect, EventKind } from '../../src/core/events';
import { segmentStart, type SceneTimeline } from '../../src/core/timeline';
import { wordStartSec } from '../../src/core/words';
import { humanPath, type Point } from './mouse';
import { center, sliderX } from './geometry';

export interface Clock { now(): number; sleep(ms: number): Promise<void> }
export const realClock: Clock = { now: () => Date.now() / 1000, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };

export type Target = Locator | Point;
const isPoint = (t: Target): t is Point => typeof (t as Point).x === 'number' && typeof (t as Point).y === 'number';

interface MoveOpts { dur?: number }

export class Director {
  events: RecEvent[] = [];
  mouse: MousePoint[] = [];
  lags: { cue: string; lagSec: number }[] = [];
  private pos: Point = { x: 960, y: 1060 };
  private down = false;
  private t0 = 0;

  constructor(public page: Page, public timeline: SceneTimeline, private clock: Clock = realClock) {}

  start(): void { this.t0 = this.clock.now(); this.logMouse(); }
  t(): number { return this.clock.now() - this.t0; }
  startedAt(): number { return this.t0; }
  maxLag(): number { return this.lags.reduce((m, l) => Math.max(m, l.lagSec), 0); }

  async at(sec: number, label = `${sec.toFixed(2)}s`): Promise<void> {
    const lag = this.t() - sec;
    if (lag > 0.001) this.lags.push({ cue: label, lagSec: lag });
    else if (lag < 0) await this.clock.sleep(-lag * 1000);
  }
  cue(seg: string, offset = 0) { return this.at(segmentStart(this.timeline, seg) + offset, `${seg}+${offset}`); }
  cueWord(seg: string, word: string, offset = 0, occurrence = 0) {
    const s = this.timeline.segments.find((x) => x.id === seg);
    if (!s) throw new Error(`Segmento ${seg} no existe`);
    return this.at(wordStartSec(s, word, occurrence) + offset, `${seg}:${word}+${offset}`);
  }
  wait(sec: number) { return this.clock.sleep(sec * 1000); }

  private async rectOf(target: Target): Promise<Rect> {
    if (isPoint(target)) return { x: target.x - 1, y: target.y - 1, w: 2, h: 2 };
    // Los clics son de mouse real: un elemento fuera del área visible de un panel con scroll no recibiría el clic.
    await target.scrollIntoViewIfNeeded();
    const bb = await target.boundingBox();
    if (!bb) throw new Error(`Elemento no visible: ${String(target)}`);
    return { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
  }
  private logMouse() { this.mouse.push({ tSec: this.t(), x: this.pos.x, y: this.pos.y, down: this.down }); }
  private addEvent(e: RecEvent) {
    if (this.events.some((x) => x.id === e.id)) throw new Error(`Evento repetido: ${e.id}`);
    this.events.push(e);
  }

  async move(target: Target, dur = 0.8): Promise<Point> {
    const to = isPoint(target) ? target : center(await this.rectOf(target));
    const path = humanPath(this.pos, to, dur);
    const start = this.t();
    // Se toma el punto que corresponde al tiempo real: si un mouse.move tarda, se saltan
    // puntos en vez de alargar el movimiento (la duración manda, no el número de puntos).
    for (let i = 0; i < path.length; ) {
      const p = path[i]!;
      const wait = start + p.t - this.t();
      if (wait > 0) await this.clock.sleep(wait * 1000);
      await this.page.mouse.move(p.x, p.y);
      this.pos = { x: p.x, y: p.y };
      this.logMouse();
      if (i === path.length - 1) break;
      const elapsed = this.t() - start;
      let next = i + 1;
      while (next < path.length - 1 && path[next + 1]!.t <= elapsed) next++;
      i = next;
    }
    return to;
  }

  private async tap(id: string, kind: EventKind, target: Target, opts: MoveOpts, act: () => Promise<void>) {
    const rect = await this.rectOf(target);
    const tSec = this.t();
    await this.move(isPoint(target) ? target : center(rect), opts.dur ?? 0.8);
    await act();
    this.addEvent({ id, kind, tSec, endSec: this.t(), rect });
  }

  click(id: string, target: Target, opts: MoveOpts = {}) {
    return this.tap(id, 'click', target, opts, async () => {
      this.down = true; this.logMouse(); await this.page.mouse.down(); await this.clock.sleep(70);
      await this.page.mouse.up(); this.down = false; this.logMouse();
    });
  }
  /** pointerdown/up sin movimiento (seleccionar sala, parada de ruta). */
  press(id: string, target: Target, opts: MoveOpts = {}) { return this.click(id, target, opts); }

  async drag(id: string, from: Target, to: Target, opts: MoveOpts & { holdSec?: number; approach?: number } = {}) {
    const rect = await this.rectOf(from);
    const toRect = await this.rectOf(to);
    const tSec = this.t();
    await this.move(isPoint(from) ? from : center(rect), opts.approach ?? 0.7);
    this.down = true; await this.page.mouse.down(); this.logMouse();
    await this.clock.sleep(120);
    await this.move(isPoint(to) ? to : center(toRect), opts.dur ?? 1.4);
    if (opts.holdSec) await this.clock.sleep(opts.holdSec * 1000);
    await this.page.mouse.up(); this.down = false; this.logMouse();
    this.addEvent({ id, kind: 'drag', tSec, endSec: this.t(), rect, toRect });
  }

  async slider(id: string, locator: Locator, o: { from: number; to: number; min: number; max: number; dur?: number; approach?: number }) {
    const rect = await this.rectOf(locator);
    const y = rect.y + rect.h / 2;
    await this.drag(id, { x: sliderX(rect, o.from, o.min, o.max), y }, { x: sliderX(rect, o.to, o.min, o.max), y }, { dur: o.dur ?? 1.6, approach: o.approach });
    const e = this.events.at(-1)!; e.rect = rect;
  }

  /** Selects nativos: el popup no se captura, así que se anima el clic y se asigna el valor. */
  choose(id: string, locator: Locator, value: string, opts: MoveOpts = {}) {
    return this.tap(id, 'click', locator, opts, async () => {
      this.down = true; this.logMouse(); await this.clock.sleep(90); this.down = false; this.logMouse();
      await locator.selectOption(value);
    });
  }

  async type(id: string, locator: Locator, text: string, o: MoveOpts & { cps?: number } = {}) {
    await this.click(`${id}:focus`, locator, o);
    const tSec = this.t();
    await locator.pressSequentially(text, { delay: 1000 / (o.cps ?? 16) });
    this.addEvent({ id, kind: 'type', tSec, endSec: this.t(), rect: await this.rectOf(locator) });
  }

  async key(id: string, keys: string) {
    const tSec = this.t();
    await this.page.keyboard.press(keys);
    this.addEvent({ id, kind: 'key', tSec, endSec: this.t() });
  }

  async mark(id: string, target: Target) {
    const tSec = this.t();
    this.addEvent({ id, kind: 'mark', tSec, endSec: tSec, rect: await this.rectOf(target) });
  }

  async waitUntil(id: string, fn: () => Promise<unknown>, target?: Target, timeoutSec = 30) {
    const tSec = this.t();
    await Promise.race([fn(), this.clock.sleep(timeoutSec * 1000).then(() => { throw new Error(`Timeout esperando ${id}`); })]);
    this.addEvent({ id, kind: 'mark', tSec, endSec: this.t(), rect: target ? await this.rectOf(target) : undefined });
  }

  toRecording(sceneId: string, video: string, durationSec: number): Recording {
    return { sceneId, video, durationSec, viewport: { w: 1920, h: 1080 }, events: this.events, mouse: this.mouse, maxLagSec: this.maxLag() };
  }
}
