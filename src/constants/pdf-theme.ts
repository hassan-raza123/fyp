/**
 * Colours for generated PDFs.
 *
 * jsPDF takes RGB tuples and cannot read CSS custom properties, so these are
 * the one place outside email templates where the palette has to be duplicated
 * as literals. Keep them in step with `globals.css` by hand.
 *
 * They were previously inlined at each call site, and had drifted into four
 * different brand colours at once — a lavender, two dead purples, and the
 * navy from a university crest the product no longer uses. Every report a
 * customer exported carried whichever one that file happened to use.
 */

export type Rgb = [number, number, number];

/** Accent — table headers on ordinary reports. #4F46E5 */
export const PDF_ACCENT: Rgb = [79, 70, 229];

/** Muted header for secondary tables. #646C79 */
export const PDF_MUTED: Rgb = [100, 108, 121];

/**
 * Attainment. Same reservation as on screen: these three mean attained,
 * partially attained and not attained, and nothing else.
 */
export const PDF_GOOD: Rgb = [21, 128, 61];   // #15803D
export const PDF_WARN: Rgb = [180, 83, 9];    // #B45309
export const PDF_BAD: Rgb = [180, 35, 24];    // #B42318

/** Body text and hairlines. */
export const PDF_INK: Rgb = [22, 25, 31];     // #16191F
export const PDF_RULE: Rgb = [226, 229, 234]; // #E2E5EA
