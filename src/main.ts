import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Never expose ligature names if the optional external icon font is unavailable.
void document.fonts.ready
  .then(() => document.fonts.load('24px "Material Symbols Rounded"'))
  .then((fonts) => {
    if (fonts.length) document.documentElement.classList.add('material-symbols-ready');
  })
  .catch(() => {
    /* Visible action labels remain available without the font. */
  });

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
