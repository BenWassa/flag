import { describe, expect, it, vi } from 'vitest';
import { DRAG_THRESHOLD_PX, EDGE_GUTTER_PX, installGestures } from './gestures.js';

/**
 * Issue #166 — tap must stay distinct from rotate, drag and pinch.
 * Issue #200 — a visible tiny-country marker must remain practically tappable.
 *
 * These are the regressions for the pointer-ownership defect that made small
 * geography unselectable: the stage used to rotate on any movement and resolve
 * the tap at the release point, so ordinary finger jitter rotated the target
 * away and then picked the displaced position.
 */

function stage() {
  const element = document.createElement('div');
  Object.defineProperty(element, 'clientWidth', { value: 360, configurable: true });
  element.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 360, bottom: 640, width: 360, height: 640, x: 0, y: 0, toJSON: () => ({}),
  });
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  document.body.append(element);
  return element;
}

function pointer(type: string, id: number, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
  Object.assign(event, { pointerId: id, clientX: x, clientY: y });
  return event;
}

const handlers = () => ({ onTap: vi.fn(), onRotate: vi.fn(), onDolly: vi.fn() });

describe('spatial stage gestures', () => {
  it('reports a still tap at the position the press began', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, 180, 300));
    element.dispatchEvent(pointer('pointerup', 1, 180, 300));
    expect(spy.onTap).toHaveBeenCalledWith(180, 300);
    expect(spy.onRotate).not.toHaveBeenCalled();
  });

  it('does not rotate, and reports the press position, when a tap jitters', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, 180, 300));
    element.dispatchEvent(pointer('pointermove', 1, 183, 302));
    element.dispatchEvent(pointer('pointermove', 1, 185, 304));
    element.dispatchEvent(pointer('pointerup', 1, 185, 304));
    expect(spy.onRotate).not.toHaveBeenCalled();
    expect(spy.onTap).toHaveBeenCalledWith(180, 300);
  });

  it('takes no pointer capture until movement crosses the drag threshold', () => {
    const element = stage();
    installGestures(element, handlers());
    element.dispatchEvent(pointer('pointerdown', 1, 180, 300));
    expect(element.setPointerCapture).not.toHaveBeenCalled();
    element.dispatchEvent(pointer('pointermove', 1, 180 + DRAG_THRESHOLD_PX + 4, 300));
    expect(element.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('rotates once dragging, and never reports that drag as a tap', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, 180, 300));
    element.dispatchEvent(pointer('pointermove', 1, 220, 300));
    element.dispatchEvent(pointer('pointermove', 1, 260, 300));
    element.dispatchEvent(pointer('pointerup', 1, 260, 300));
    expect(spy.onRotate).toHaveBeenCalled();
    expect(spy.onTap).not.toHaveBeenCalled();
  });

  it('absorbs the threshold rather than applying it, so the globe does not jump', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, 180, 300));
    element.dispatchEvent(pointer('pointermove', 1, 180 + DRAG_THRESHOLD_PX + 2, 300));
    expect(spy.onRotate).not.toHaveBeenCalled();
    element.dispatchEvent(pointer('pointermove', 1, 180 + DRAG_THRESHOLD_PX + 6, 300));
    const [deltaLon] = spy.onRotate.mock.calls[0];
    expect(deltaLon).toBeCloseTo(4 * (180 / 360), 5);
  });

  it('treats a pinch as a dolly and never as a tap', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, 150, 300));
    element.dispatchEvent(pointer('pointerdown', 2, 210, 300));
    element.dispatchEvent(pointer('pointermove', 2, 270, 300));
    expect(spy.onDolly).toHaveBeenCalled();
    element.dispatchEvent(pointer('pointerup', 2, 270, 300));
    element.dispatchEvent(pointer('pointerup', 1, 150, 300));
    expect(spy.onTap).not.toHaveBeenCalled();
  });

  it('allows a stationary edge tap without capturing or rotating', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    const x = EDGE_GUTTER_PX - 2;
    element.dispatchEvent(pointer('pointerdown', 1, x, 300));
    element.dispatchEvent(pointer('pointerup', 1, x, 300));
    expect(element.setPointerCapture).not.toHaveBeenCalled();
    expect(spy.onRotate).not.toHaveBeenCalled();
    expect(spy.onTap).toHaveBeenCalledWith(x, 300);
  });

  it('leaves an edge swipe to the platform and never resolves it as a tap', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, EDGE_GUTTER_PX - 2, 300));
    element.dispatchEvent(pointer('pointermove', 1, 120, 300));
    element.dispatchEvent(pointer('pointerup', 1, 120, 300));
    expect(element.setPointerCapture).not.toHaveBeenCalled();
    expect(spy.onRotate).not.toHaveBeenCalled();
    expect(spy.onTap).not.toHaveBeenCalled();
  });

  it('leaves edge multi-touch to the platform and never turns it into a tap', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    const x = EDGE_GUTTER_PX - 2;
    element.dispatchEvent(pointer('pointerdown', 1, x, 300));
    element.dispatchEvent(pointer('pointerdown', 2, x + 20, 300));
    element.dispatchEvent(pointer('pointerup', 2, x + 20, 300));
    element.dispatchEvent(pointer('pointerup', 1, x, 300));
    expect(element.setPointerCapture).not.toHaveBeenCalled();
    expect(spy.onDolly).not.toHaveBeenCalled();
    expect(spy.onRotate).not.toHaveBeenCalled();
    expect(spy.onTap).not.toHaveBeenCalled();
  });

  it('recovers after a cancelled pointer', () => {
    const element = stage();
    const spy = handlers();
    installGestures(element, spy);
    element.dispatchEvent(pointer('pointerdown', 1, 180, 300));
    element.dispatchEvent(pointer('pointermove', 1, 260, 300));
    element.dispatchEvent(pointer('pointercancel', 1, 260, 300));
    element.dispatchEvent(pointer('pointerdown', 2, 100, 200));
    element.dispatchEvent(pointer('pointerup', 2, 100, 200));
    expect(spy.onTap).toHaveBeenCalledWith(100, 200);
  });
});