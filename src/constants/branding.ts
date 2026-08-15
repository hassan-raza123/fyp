/**
 * Product identity.
 *
 * These describe *our* product and are the same for every customer, so they are
 * constants rather than settings. The customer's own identity — the university
 * name that appears beside ours on the login screen, in emails and on generated
 * reports — is per-installation and lives in `Settings.system`; read it with
 * `getBranding()` in `@/lib/branding`.
 *
 * Kept free of imports so client components can use it without pulling Prisma
 * into the browser bundle.
 */

export const PRODUCT_NAME = 'Attainly';

export const PRODUCT_TAGLINE = 'Outcome-Based Education Management';

/** Used in <title> and email subjects, where the product needs explaining. */
export const PRODUCT_FULL_NAME = `${PRODUCT_NAME} — ${PRODUCT_TAGLINE}`;

export const PRODUCT_DESCRIPTION =
  'Track CLO and PLO attainment, run assessments, and generate accreditation-ready OBE reports.';

/**
 * Shown when an installation has not set its own institution name yet. It is
 * deliberately generic: a hardcoded university name is what made this codebase
 * sellable to exactly one customer.
 */
export const DEFAULT_INSTITUTION_NAME = 'Your Institution';

/**
 * How to reach *us*, the vendor — for the public marketing site.
 *
 * Every field starts empty and the footer renders only what is filled in.
 * That is deliberate. These slots previously held one university's real
 * postal address, switchboard number, official email and official social
 * accounts, carried over from when this was that university's internal
 * system. On a page selling the product to other universities, that sends
 * enquiries to an institution that has nothing to do with the product, and
 * implies an endorsement nobody agreed to.
 *
 * Fill these in with the company's own details before launch. Leaving one
 * blank hides it; it never falls back to somebody else's.
 */
export const COMPANY_CONTACT: {
  email: string;
  phone: string;
  address: string;
} = {
  email: '',
  phone: '',
  address: '',
};

export const COMPANY_SOCIAL: ReadonlyArray<{ label: string; href: string }> = [
  // { label: 'LinkedIn', href: 'https://www.linkedin.com/company/...' },
];
