import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';
import { ProjectCardComponent } from '../shared/project-card';

@Component({
  selector: 'app-home',
  imports: [NgOptimizedImage, RouterLink, ProjectCardComponent],
  template: `
    <section class="hero">
      <div class="hero-grain" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot"></span> AN INDEPENDENT CREATOR'S COLLECTION</p>
        <h1>One space.<br /><em>Every creation.</em></h1>
        <p class="hero-description">
          A home for the things I build, the ideas I explore,<br class="desktop-break" />
          and everything I learn along the way.
        </p>
        <div class="hero-actions">
          <a class="button primary" routerLink="/explore"
            >Explore the collection
            <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
          ><a class="text-link" href="#directory" (click)="skipIntro($event)"
            >Skip intro
            <span class="material-symbols-rounded" aria-hidden="true">arrow_downward</span></a
          >
        </div>
      </div>
      <div class="hero-art-stage" aria-hidden="true">
        <div class="hero-architecture">
          <div class="arch arch-outer"></div>
          <div class="arch arch-middle"></div>
          <div class="arch arch-inner"></div>
          <div class="emblem-plinth">
            <img ngSrc="ar_emblem.png" width="168" height="168" alt="" priority /><span
              >AR / ATRIUM</span
            >
          </div>
          <span class="arch-caption">A SPACE FOR POSSIBILITY</span>
        </div>
      </div>
      <div class="hero-bottom">
        <span
          >SCROLL TO STEP INSIDE
          <span class="material-symbols-rounded" aria-hidden="true">arrow_downward</span></span
        ><span>{{ catalog.projects().length }} creations. One curious mind.</span
        ><span>EST. IN CURIOSITY</span>
      </div>
    </section>
    <section class="intro-section page-wrap">
      <p class="eyebrow">WELCOME TO THE ATRIUM</p>
      <h2>Useful things.<br />Unexpected discoveries.<br /><em>Room to keep growing.</em></h2>
      <div class="intro-aside">
        <p>
          Some projects solve everyday problems. Others start with a simple “what if?” This is where
          they all come together.
        </p>
        <div class="stat-line">
          <strong>{{ catalog.projects().length }}</strong
          ><span>projects & experiments</span>
        </div>
        <a routerLink="/about" class="text-link"
          >Behind the collection
          <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
        >
      </div>
    </section>
    <section class="showcase-scene">
      <div class="page-wrap">
        <div class="section-heading">
          <div>
            <p class="eyebrow">BUILT TO BE USED</p>
            <h2>Ideas, brought to life.</h2>
          </div>
          <p>Small details. Real purposes.<br />Explore the work behind each creation.</p>
        </div>
        <div
          class="device-stage"
          role="region"
          aria-label="Featured project showcases"
          tabindex="0"
        >
          @for (project of catalog.featured().slice(0, 3); track project.id; let i = $index) {
            <a
              class="device-frame"
              [class.device-center]="i === 1"
              [routerLink]="['/app', project.id]"
              ><div class="device-notch" aria-hidden="true"></div>
              <div class="device-screen">
                <span class="eyebrow">AR ATRIUM / SELECTED WORK</span>
                <div class="device-monogram" aria-hidden="true">{{ project.name.slice(0, 2) }}</div>
                <h3>{{ project.name }}</h3>
                <p>{{ project.description }}</p>
                <span class="device-open"
                  >Explore project
                  <span class="material-symbols-rounded" aria-hidden="true"
                    >arrow_forward</span
                  ></span
                >
              </div></a
            >
          }
        </div>
        <p class="device-caption">A WINDOW INTO THE COLLECTION · ILLUSTRATIVE PROJECT SHOWCASES</p>
      </div>
    </section>
    <section class="featured-section page-wrap" id="directory">
      <div class="section-heading">
        <div>
          <p class="eyebrow">SELECTED FROM THE COLLECTION</p>
          <h2 tabindex="-1" id="featured-heading">Made with purpose.</h2>
        </div>
        <a routerLink="/explore" class="text-link"
          >View all projects
          <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
        >
      </div>
      <div class="project-grid">
        @for (project of catalog.featured().slice(0, 6); track project.id) {
          <app-project-card
            [project]="project"
            [typeLabel]="
              catalog.data()?.taxonomy?.typeLabels?.[project.projectType] ?? project.projectType
            "
          />
        }
      </div>
    </section>
    <section class="collection-paths page-wrap">
      <div class="section-heading">
        <div>
          <p class="eyebrow">FOLLOW YOUR CURIOSITY</p>
          <h2>More paths to explore.</h2>
        </div>
      </div>
      @for (group of catalog.groups(); track group.id; let i = $index) {
        <a class="collection-path" [routerLink]="group.route"
          ><span class="path-index">0{{ i + 1 }}</span>
          <h3>{{ group.label }}</h3>
          <p>{{ group.description }}</p>
          <span class="material-symbols-rounded path-arrow" aria-hidden="true"
            >arrow_forward</span
          ></a
        >
      }
    </section>
  `,
})
export class HomeComponent {
  protected readonly catalog = inject(CatalogService);
  private readonly element = inject(ElementRef<HTMLElement>);
  constructor() {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    inject(DestroyRef).onDestroy(() => {
      disposed = true;
      cleanup?.();
    });
    afterNextRender(async () => {
      const root: HTMLElement = this.element.nativeElement;
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger'),
        ]);
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        let refreshFrame = 0;
        const refresh = () => {
          if (disposed) return;
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => {
            if (!disposed) ScrollTrigger.refresh();
          });
        };
        const media = gsap.matchMedia();
        media.add(
          {
            always: '(min-width: 0px)',
            motion: '(prefers-reduced-motion: no-preference)',
            mobile: '(max-width: 850px)',
          },
          (state) => {
            const motion = state.conditions?.['motion'];
            const mobile = state.conditions?.['mobile'];
            root.dataset['motion'] = motion ? 'active' : 'reduced';
            root.dataset['intro'] = motion ? 'entering' : 'complete';
            if (!motion) return;
            const context = gsap.context(() => {
              gsap
                .timeline({
                  defaults: { ease: 'power3.out' },
                  onComplete: () => {
                    root.dataset['intro'] = 'complete';
                  },
                })
                .from('.hero-copy > *', { y: 26, opacity: 0, duration: 0.8, stagger: 0.14 }, 0)
                .from(
                  '.hero-art-stage',
                  { y: mobile ? 18 : 50, opacity: 0, scale: 0.9, duration: 1.1 },
                  0.12,
                )
                .from('.arch', { scale: 0.85, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.2);
              gsap.to('.hero-architecture', {
                y: mobile ? -28 : 100,
                scale: mobile ? 1.06 : 1.16,
                ease: 'none',
                scrollTrigger: {
                  trigger: root.querySelector('.hero'),
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 0.7,
                },
              });
              gsap.to('.arch-middle', {
                y: mobile ? -16 : -45,
                ease: 'none',
                scrollTrigger: {
                  trigger: root.querySelector('.hero'),
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 0.7,
                },
              });
              gsap.from('.intro-section > *', {
                y: 36,
                opacity: 0,
                duration: 0.85,
                stagger: 0.12,
                scrollTrigger: {
                  trigger: root.querySelector('.intro-section'),
                  start: 'top 85%',
                  once: true,
                },
              });
              gsap.utils.toArray<HTMLElement>('.device-frame', root).forEach((frame, index) => {
                gsap.from(frame, {
                  y: mobile ? 32 : 64,
                  opacity: 0,
                  duration: 0.85,
                  delay: index * 0.12,
                  ease: 'power2.out',
                  scrollTrigger: { trigger: frame, start: 'top 92%', once: true },
                });
              });
              for (const selector of [
                '.showcase-scene .section-heading',
                '.featured-section .section-heading',
                '.collection-paths .section-heading',
              ]) {
                gsap.from(selector, {
                  y: 28,
                  opacity: 0,
                  duration: 0.8,
                  scrollTrigger: {
                    trigger: root.querySelector(selector),
                    start: 'top 90%',
                    once: true,
                  },
                });
              }
            }, root);
            refresh();
            return () => context.revert();
          },
        );
        const observer = new ResizeObserver(refresh);
        observer.observe(root);
        const images = root.querySelectorAll('img');
        images.forEach((image) => image.addEventListener('load', refresh));
        void document.fonts.ready.then(refresh);
        window.addEventListener('orientationchange', refresh);
        cleanup = () => {
          media.revert();
          observer.disconnect();
          cancelAnimationFrame(refreshFrame);
          images.forEach((image) => image.removeEventListener('load', refresh));
          window.removeEventListener('orientationchange', refresh);
        };
      } catch (error) {
        cleanup?.();
        root.dataset['motion'] = 'unavailable';
        console.error('Landing animation could not initialize', error);
      }
    });
  }

  skipIntro(event: Event): void {
    event.preventDefault();
    this.element.nativeElement.querySelector('#directory')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    (this.element.nativeElement.querySelector('#featured-heading') as HTMLElement | null)?.focus({
      preventScroll: true,
    });
  }
}
