import { Component, inject } from '@angular/core';
import { MotionService } from '../core/motion.service';

@Component({
  selector: 'app-motion-preference',
  template: `
    <label
      >Motion
      <select
        aria-label="Motion preference"
        [value]="motion.mode()"
        (change)="motion.setMode(choice.value)"
        #choice
      >
        <option value="system">System</option>
        <option value="on">On</option>
        <option value="off">Off</option>
      </select>
    </label>
    <p>
      System follows your device. On enables decorative movement even when your device requests
      reduced motion. Off keeps content static.
    </p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 26rem;
    }
    label {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    select {
      min-height: 44px;
      width: auto;
      flex: 1;
      padding: 8px 12px;
    }
    p {
      font-size: 0.8rem;
      line-height: 1.5;
      color: var(--muted);
      margin: 8px 0 0;
    }
  `,
})
export class MotionPreferenceComponent {
  protected readonly motion = inject(MotionService);
}
