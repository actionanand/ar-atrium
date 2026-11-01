import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MotionService, type MotionMode } from '../core/motion.service';
import { MotionNoticeComponent } from './motion-notice';

describe('MotionNoticeComponent', () => {
  beforeEach(() => localStorage.removeItem('ar-atrium.motion-notice.v1'));
  afterEach(() => localStorage.removeItem('ar-atrium.motion-notice.v1'));
  it('remembers Keep system setting without enabling motion', () => {
    const setMode = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MotionService,
          useValue: { mode: signal('system'), systemReduced: signal(true), setMode },
        },
      ],
    });
    const fixture = TestBed.createComponent(MotionNoticeComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.keep-system').click();
    fixture.detectChanges();
    expect(setMode).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
    expect(localStorage.getItem('ar-atrium.motion-notice.v1')).toBe('dismissed');
    const next = TestBed.createComponent(MotionNoticeComponent);
    next.detectChanges();
    expect(next.nativeElement.querySelector('aside')).toBeNull();
  });
  for (const reduced of [true, false])
    for (const selected of ['system', 'on', 'off'] as const)
      it(`shows the explanation only for System + reduce: ${selected}, ${reduced}`, () => {
        const mode = signal<MotionMode>(selected);
        TestBed.configureTestingModule({
          providers: [
            {
              provide: MotionService,
              useValue: {
                mode,
                systemReduced: signal(reduced),
                setMode: vi.fn(),
              },
            },
          ],
        });
        const fixture = TestBed.createComponent(MotionNoticeComponent);
        fixture.detectChanges();
        expect(!!fixture.nativeElement.querySelector('aside')).toBe(
          selected === 'system' && reduced,
        );
      });
  it('enables motion only after explicit action and removes the notice', () => {
    const mode = signal<MotionMode>('system');
    const setMode = vi.fn((value: MotionMode) => mode.set(value));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MotionService,
          useValue: {
            mode,
            systemReduced: signal(true),
            setMode,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MotionNoticeComponent);
    fixture.detectChanges();
    expect(setMode).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(setMode).toHaveBeenCalledExactlyOnceWith('on');
    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
  });
});
