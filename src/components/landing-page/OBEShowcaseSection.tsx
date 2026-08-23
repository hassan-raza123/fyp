'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  Layers,
  Network,
  Repeat,
  ScrollText,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import {
  AssessmentVisual,
  AttainmentVisual,
  OutcomeHierarchyVisual,
} from './ShowcaseVisuals';

/**
 * The three capability areas.
 *
 * The tabs used to be "Why Attainly?", "PDCA Framework" and "CLO-PLO
 * Mapping". The first listed features rather than reasons, and its four
 * bullets — "Automated CLO & PLO Tracking", "Real-time Analytics & Reports",
 * "Smart Outcome Mapping", "Paperless Assessment System" — were repeated
 * almost word for word by the module grid further down the page. The second
 * explained Plan-Do-Check-Act, a textbook concept every reader of this page
 * already knows, on the page's most valuable real estate. Only the third
 * described the product.
 *
 * These three are the actual shape of the system: define the outcomes,
 * capture evidence against them, read what came out.
 */
const showcaseItems = [
  {
    id: 'mapping',
    title: 'Outcome mapping',
    subtitle: 'The spine of OBE',
    heading: 'One hierarchy, mapped end to end',
    body: 'PEOs, PLOs, CLOs and LLOs are not four separate lists. Map them once and every attainment figure on every screen is traceable back through the mapping that produced it.',
    icon: Network,
    Visual: OutcomeHierarchyVisual,
    features: [
      { icon: Layers, text: 'PEO, PLO, CLO and LLO hierarchy' },
      { icon: GitBranch, text: 'PEO–PLO, CLO–PLO and LLO–PLO matrices' },
      { icon: Target, text: 'Programme curriculum mapping' },
      { icon: BarChart3, text: 'PLO coverage matrix' },
    ],
  },
  {
    id: 'assessment',
    title: 'Assessment & grading',
    subtitle: 'Where the evidence comes from',
    heading: 'Captured while teaching, not afterwards',
    body: 'Each question on each paper carries the CLO it tests and its Bloom level. Faculty enter marks the way they always have; the attainment evidence is a by-product, not a second exercise.',
    icon: ClipboardCheck,
    Visual: AssessmentVisual,
    features: [
      { icon: Target, text: 'Assessment items tagged to a CLO' },
      { icon: SlidersHorizontal, text: 'Rubric-based marking' },
      { icon: Layers, text: "Bloom's taxonomy analysis" },
      { icon: ScrollText, text: 'Marks entry, evaluation and result sheets' },
    ],
  },
  {
    id: 'attainment',
    title: 'Attainment & reporting',
    subtitle: 'What a panel asks for',
    heading: 'Evidence that is already assembled',
    body: 'Attainment is computed from live marks at every level, against thresholds you set. When a review comes, the course files and OBE reports are generated from the same records the figures came from.',
    icon: FileCheck2,
    Visual: AttainmentVisual,
    features: [
      { icon: BarChart3, text: 'CLO, LLO, PLO and PEO attainment' },
      { icon: SlidersHorizontal, text: 'Configurable pass/fail and graduation criteria' },
      { icon: FileCheck2, text: 'Course files and OBE reports' },
      { icon: Repeat, text: 'Action plans that close the loop' },
    ],
  },
];

export default function OBEShowcaseSection() {
  const [activeTab, setActiveTab] = useState(showcaseItems[0].id);
  const [hasEntered, setHasEntered] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const activeItem =
    showcaseItems.find((item) => item.id === activeTab) ?? showcaseItems[0];
  const IconComponent = activeItem.icon;
  const Visual = activeItem.Visual;

  /*
    Reveal-on-scroll, as an enhancement only.

    This used to gate the content itself: until the observer fired, both
    columns carried `opacity-0`. So the entire section — the diagram and all
    four feature cards — was invisible on first paint, and stayed invisible
    for anyone whose JavaScript was slow, blocked or errored, and in any
    render that does not scroll (print, a link preview, a full-page capture).
    A threshold of 0.3 on a two-column grid this tall also never resolves on
    a short viewport.

    Now the markup is visible by default and the animation is added once the
    section is reached.
  */
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    // Captured above: reading `sectionRef.current` in the cleanup could
    // unobserve a different node than the one observed.
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id='obe-showcase'
      className='relative section-ink py-24 overflow-hidden scroll-mt-24'
    >
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <span className='inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold tracking-wider text-white/90'>
            HOW IT FITS TOGETHER
          </span>
          <h2 className='mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white'>
            Three parts, one chain of evidence
          </h2>
          <p className='mt-4 text-base sm:text-lg max-w-2xl mx-auto text-white/75'>
            Every number a panel is shown can be traced back to the question a
            student answered.
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          role='tablist'
          aria-label='Capability areas'
          className='flex justify-center gap-3 mb-12 flex-wrap'
        >
          {showcaseItems.map((item) => {
            const TabIcon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type='button'
                role='tab'
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  selected
                    ? 'accent-btn'
                    : 'bg-white/[0.08] backdrop-blur border border-white/15 text-white/85 hover:bg-white/15 hover:text-white'
                }`}
              >
                <TabIcon className='w-4 h-4' />
                {/* The label was `hidden sm:inline`, so on a phone the three
                    tabs were three unlabelled icons. */}
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div
          ref={sectionRef}
          role='tabpanel'
          id={`panel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
          className='grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center'
        >
          {/* Left - the diagram */}
          <div className='order-2 lg:order-1'>
            <div
              key={`visual-${activeTab}`}
              className={`relative group ${hasEntered ? 'animate-slide-left' : ''}`}
            >
              <div
                aria-hidden
                className='absolute -inset-4 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition-opacity'
                style={{ background: 'var(--accent)' }}
              />
              <div className='relative bg-surface rounded-2xl overflow-hidden shadow-2xl border border-white/10'>
                <Visual />
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className='order-1 lg:order-2'>
            <div
              key={`content-${activeTab}`}
              className={`space-y-7 ${hasEntered ? 'animate-slide-right' : ''}`}
            >
              <div>
                <div className='inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg mb-4 bg-white/[0.08] backdrop-blur border border-white/15'>
                  {/* Both were `text-brand-secondary`. That token resolves to
                      the same indigo as the primary, landing near 2:1 on this
                      ground — the eyebrow was effectively unreadable. */}
                  <IconComponent
                    className='w-4 h-4'
                    style={{ color: 'var(--primary-300)' }}
                  />
                  <span
                    className='text-xs font-semibold uppercase tracking-wider'
                    style={{ color: 'var(--primary-300)' }}
                  >
                    {activeItem.subtitle}
                  </span>
                </div>
                <h3 className='text-2xl sm:text-3xl font-bold text-white'>
                  {activeItem.heading}
                </h3>
                <p className='mt-3 text-base leading-relaxed text-white/75'>
                  {activeItem.body}
                </p>
              </div>

              {/* Features Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {activeItem.features.map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div
                      key={feature.text}
                      className='flex items-start gap-3 p-4 rounded-xl bg-white/[0.06] backdrop-blur border border-white/12 transition-colors hover:bg-white/[0.1]'
                    >
                      {/* The icon plate alternated brand-primary and
                          brand-secondary by index. Both are the same indigo,
                          so the alternation was invisible. */}
                      <span
                        className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        <FeatureIcon className='w-4 h-4 text-white' />
                      </span>
                      <p className='text-sm font-medium leading-snug text-white/90 pt-1.5'>
                        {feature.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
