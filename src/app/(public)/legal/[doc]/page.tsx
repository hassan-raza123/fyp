import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCT_NAME, COMPANY_CONTACT } from '@/constants/branding';

/**
 * Terms of Service and Privacy Policy.
 *
 * The footer has linked to `/terms` and `/privacy` since the marketing pages
 * were written, and neither route existed — both 404'd. A university's legal
 * review reaches these two links early and stops when they are dead, so the
 * routes matter more than the prose.
 *
 * What is below is a **skeleton, not legal advice**. It lists the sections a
 * reviewer expects and states plainly, on the page, that the document is not
 * yet in force. That is the honest state of it: publishing invented legal text
 * that appears binding would be worse than publishing nothing, because a
 * customer could rely on it.
 *
 * Replace each section body with text a lawyer has approved, then delete the
 * `draft` banner. Do not ship this to a paying customer as-is.
 */

const DOCS = {
  terms: {
    title: 'Terms of Service',
    intro: `The terms under which institutions and their users access ${PRODUCT_NAME}.`,
    sections: [
      ['Who these terms bind', 'The contracting institution, and every account it creates — administrators, faculty and students.'],
      ['The service', 'What is provided: outcome-based education management, assessment and attainment records, and accreditation reporting.'],
      ['Institution responsibilities', 'Accuracy of uploaded records, lawful basis for processing student data, and management of its own user accounts.'],
      ['Fees and payment terms', 'Subscription basis, billing period, invoicing and the consequences of non-payment.'],
      ['Availability and support', 'Target availability, planned maintenance, support channels and response expectations.'],
      ['Data ownership', 'The institution owns its academic records. Export on request, and on termination.'],
      ['Termination', 'Notice period on either side, and what happens to the data afterwards.'],
      ['Liability', 'Limits of liability, and the exclusions that apply.'],
      ['Governing law', 'Jurisdiction and how disputes are resolved.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: `How ${PRODUCT_NAME} handles personal data belonging to students, faculty and staff.`,
    sections: [
      ['Who controls the data', 'The institution is the data controller; we process on its instructions.'],
      ['What we collect', 'Names, institutional email addresses, roll numbers, enrolment, assessment marks, attendance and attainment records.'],
      ['Why we collect it', 'To deliver the service the institution has contracted for — nothing here is sold or used for advertising.'],
      ['Where it is stored', 'Hosting location, and whether data crosses a border.'],
      ['How long we keep it', 'Retention period for academic records, and the deletion process when an institution leaves.'],
      ['Who else sees it', 'Sub-processors — hosting, email delivery, error monitoring — and what each receives.'],
      ['Security', 'Encryption in transit, access control, audit logging and how incidents are handled.'],
      ['Individual rights', 'How a student or staff member requests access, correction or deletion of their record.'],
      ['Contact', 'Who to write to about anything in this policy.'],
    ],
  },
} as const;

type DocKey = keyof typeof DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) return { title: `Not found | ${PRODUCT_NAME}` };
  return { title: `${entry.title} | ${PRODUCT_NAME}`, description: entry.intro };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) notFound();

  return (
    <main className='min-h-screen bg-background text-ink'>
      <div className='max-w-3xl mx-auto px-6 py-16'>
        <Link
          href='/'
          className='text-sm font-medium text-primary hover:underline'
        >
          ← {PRODUCT_NAME}
        </Link>

        <h1 className='text-4xl font-bold mt-8 mb-3 tracking-tight'>
          {entry.title}
        </h1>
        <p className='text-ink-2 text-lg mb-8'>{entry.intro}</p>

        <div className='rounded-lg border border-warn/40 bg-warn-wash p-4 mb-12'>
          <p className='text-sm text-warn font-semibold mb-1'>
            Draft — not yet in force
          </p>
          <p className='text-sm text-ink-2'>
            This document is an outline awaiting legal review. It does not
            create obligations for either party, and no institution should rely
            on it. Contact us for the executed agreement.
          </p>
        </div>

        <ol className='space-y-8 list-none p-0 m-0'>
          {entry.sections.map(([heading, body], i) => (
            <li key={heading}>
              <h2 className='text-lg font-semibold mb-2'>
                <span className='text-ink-muted font-mono text-sm mr-3'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {heading}
              </h2>
              <p className='text-ink-2 leading-relaxed pl-10'>{body}</p>
            </li>
          ))}
        </ol>

        <hr className='my-12 border-subtle' />

        <p className='text-sm text-ink-muted'>
          Questions about this document
          {COMPANY_CONTACT.email ? (
            <>
              {' — '}
              <a
                href={`mailto:${COMPANY_CONTACT.email}`}
                className='text-primary hover:underline'
              >
                {COMPANY_CONTACT.email}
              </a>
            </>
          ) : (
            ' can be sent to the address listed on our company site.'
          )}
        </p>
      </div>
    </main>
  );
}
