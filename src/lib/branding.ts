import { prisma } from './prisma';
import {
  DEFAULT_INSTITUTION_NAME,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from '@/constants/branding';

/**
 * The customer's own identity, read from `Settings.system`.
 *
 * The login screen, outbound email and generated reports all need to say which
 * university they belong to. That used to be hardcoded to one institution in
 * nine different files, which is the single thing that made this installable
 * for exactly one customer. It is now a setting.
 *
 * Server-only: it reads the database. Client components should take the
 * resolved values as props, or import the constants from
 * `@/constants/branding` when they only need the product name.
 */

export interface Branding {
  /** Our product. Constant across installations. */
  productName: string;
  productTagline: string;
  /** The customer. "MNS University of Engineering & Technology", say. */
  institutionName: string;
  /** Short form for tight spaces — "MNSUET". Falls back to the full name. */
  institutionShortName: string;
  /**
   * The institution's own IT support address, shown on the login screen.
   * Empty means the support line is not rendered at all — better than
   * pointing a locked-out user at an address that is not theirs.
   */
  supportEmail: string;
  /** True when the installation has not been branded yet. */
  isUnbranded: boolean;
}

const FALLBACK: Branding = {
  productName: PRODUCT_NAME,
  productTagline: PRODUCT_TAGLINE,
  institutionName: DEFAULT_INSTITUTION_NAME,
  institutionShortName: DEFAULT_INSTITUTION_NAME,
  supportEmail: '',
  isUnbranded: true,
};

function readSystemSettings(system: unknown): Record<string, unknown> {
  // The column is JSON, but older rows were written as a JSON *string*.
  // `syncDepartmentFromSettings` handles the same two shapes.
  if (typeof system === 'string') {
    try {
      return JSON.parse(system) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (system as Record<string, unknown>) ?? {};
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/**
 * Resolve branding for this installation.
 *
 * Never throws: branding decorates every page including the login screen, so a
 * missing settings row or an unreachable database must degrade to the generic
 * product name rather than take the app down.
 */
export async function getBranding(): Promise<Branding> {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) return FALLBACK;

    const system = readSystemSettings(settings.system);

    const institutionName =
      asNonEmptyString(system.institutionName) ??
      // `applicationName` is what the settings screen has always written. It
      // held a value like "Smart Campus for MNSUET" — the institution's name
      // with a product name wrapped around it — so it is a usable fallback
      // for installations that predate `institutionName`.
      asNonEmptyString(system.applicationName);

    if (!institutionName) return FALLBACK;

    return {
      productName: PRODUCT_NAME,
      productTagline: PRODUCT_TAGLINE,
      institutionName,
      institutionShortName:
        asNonEmptyString(system.institutionShortName) ?? institutionName,
      supportEmail: asNonEmptyString(system.supportEmail) ?? '',
      isUnbranded: false,
    };
  } catch (error) {
    console.error('Failed to resolve branding, falling back to defaults:', error);
    return FALLBACK;
  }
}
