import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { LockComponent } from './lock';
import { ThemeService } from '../core/theme.service';
import { AuthService } from '../core/auth.service';
import { ProjectCardComponent } from '../shared/project-card';

describe('Material Symbol controls', () => {
  it('keeps password visibility and theme labels synchronized with their action icons', async () => {
    const dark = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { configured: true } },
        { provide: ThemeService, useValue: { dark, toggle: () => dark.update((v) => !v) } },
      ],
    });
    const fixture = TestBed.createComponent(LockComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector<HTMLButtonElement>('[aria-controls="password"]')!;
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    expect(toggle.textContent).toContain('visibility');
    toggle.click();
    fixture.detectChanges();
    expect(host.querySelector<HTMLInputElement>('#password')?.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
    expect(toggle.textContent).toContain('visibility_off');
    host.querySelector<HTMLButtonElement>('.theme-lock')!.click();
    fixture.detectChanges();
    expect(host.querySelector('.theme-lock')?.getAttribute('aria-label')).toBe(
      'Switch to light theme',
    );
    expect(host.querySelector('.theme-lock')?.textContent).toContain('light_mode');
  });
  it('opens and closes the CDK preview while keeping its accessible controls', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', {
      id: 'test',
      name: 'Test project',
      description: 'Preview test',
      category: 'test',
      projectType: 'playground',
      repositories: [],
      destinations: [],
    });
    fixture.componentRef.setInput('typeLabel', 'Playground');
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-haspopup="dialog"]',
    )!;
    expect(button.textContent).toContain('preview');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const close = document.querySelector<HTMLButtonElement>('[aria-label="Close preview"]')!;
    expect(close.textContent).toContain('close');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    close.click();
    fixture.detectChanges();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });
});
