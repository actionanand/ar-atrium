import { TestBed } from '@angular/core/testing';
import { MotionService } from './motion.service';

describe('MotionService', () => {
  let query: EventTarget & { matches: boolean };
  beforeEach(() => {
    localStorage.clear();
    query = Object.assign(new EventTarget(), { matches: true });
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => query),
    );
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it('defaults to System and responds to live device changes', () => {
    const motion = TestBed.inject(MotionService);
    expect(motion.mode()).toBe('system');
    expect(motion.animate()).toBe(false);
    query.dispatchEvent(Object.assign(new Event('change'), { matches: false }));
    expect(motion.animate()).toBe(true);
    motion.setMode('off');
    expect(motion.animate()).toBe(false);
    motion.setMode('on');
    query.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    expect(motion.animate()).toBe(true);
    TestBed.tick();
    expect(document.documentElement.dataset['motionEnabled']).toBe('true');
  });
  it('validates stored modes and synchronizes another tab without writing back', () => {
    localStorage.setItem('ar-atrium.motion.v1', 'bad');
    const motion = TestBed.inject(MotionService);
    expect(motion.mode()).toBe('system');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'ar-atrium.motion.v1', newValue: 'on' }),
    );
    expect(motion.mode()).toBe('on');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'ar-atrium.motion.v1', newValue: null }),
    );
    expect(motion.mode()).toBe('system');
    motion.setMode('invalid');
    expect(motion.mode()).toBe('system');
  });
  it('works when storage reads and writes throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const motion = TestBed.inject(MotionService);
    expect(motion.mode()).toBe('system');
    motion.setMode('on');
    expect(motion.animate()).toBe(true);
  });
  it('removes system and storage listeners on destruction', () => {
    const removeQuery = vi.spyOn(query, 'removeEventListener');
    const removeWindow = vi.spyOn(window, 'removeEventListener');
    TestBed.inject(MotionService);
    TestBed.resetTestingModule();
    expect(removeQuery).toHaveBeenCalledWith('change', expect.any(Function));
    expect(removeWindow).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
