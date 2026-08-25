import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCT_NAME, COMPANY_CONTACT } from '@/constants/branding';

/**
 * Terms of Use and Privacy Policy.
 *
 * The footer has linked to both since the marketing pages were written, and
 * neither route existed — both 404'd. A university's legal review reaches
 * these two links early and stops when they are dead.
 *
 * Both documents are now in force, and both are checkable rather than
 * lawyerly, because each was deliberately scoped to something this codebase
 * can actually vouch for:
 *
 *  - **Privacy Policy.** Not a contract — a description of what the software
 *    does with personal data. Every statement was written against the Prisma
 *    schema and the code that reads it: the tables named exist, the fields
 *    listed are the fields stored, and the one external processor named is
 *    the only outbound connection the application makes.
 *
 *  - **Terms of Use.** These describe how people may use the system: how
 *    accounts are issued, what each role may reach, what happens to academic
 *    records, and what counts as misuse. Every rule is one the code enforces
 *    or the institution operates.
 *
 * What is deliberately *not* here is the commercial agreement between the
 * vendor and the institution — fees, service levels, liability, governing
 * law, termination. That is a contract, it needs a lawyer, and it is
 * negotiated privately rather than published; the "What this document is
 * not" section says so on the page. An earlier draft of this file tried to
 * be that contract and had to carry a "not yet in force" banner as a result.
 *
 * The `draft` flag remains on LegalDoc so a future document can be published
 * as an outline without pretending to be binding.
 *
 * If the data model or the access rules change, this page changes with them.
 * The sections most likely to go stale are "What is collected", "Who else
 * receives it" and "What you may reach".
 */

interface Section {
  heading: string;
  body: string;
  items?: readonly string[];
}

interface LegalDoc {
  title: string;
  intro: string;
  /** Shows the "not yet in force" banner and suppresses the effective date. */
  draft: boolean;
  updated?: string;
  sections: readonly Section[];
}

const DOCS: Record<string, LegalDoc> = {
  terms: {
    title: 'Terms of Use',
    intro: `The rules for using ${PRODUCT_NAME}, for everyone your institution gives an account to — and for anyone answering a survey.`,
    draft: false,
    updated: 'August 2026',
    sections: [
      {
        heading: 'Who these terms apply to',
        body: `Anyone signing in to ${PRODUCT_NAME} with an account their institution issued — students, faculty, department administrators — and anyone completing a survey through an invitation link without an account. Using the system means accepting what is set out here.`,
      },
      {
        heading: 'What this document is not',
        body: `These are terms of use, not a commercial contract. Whatever agreement exists between ${PRODUCT_NAME} and the institution that runs it — pricing, service levels, liability, notice periods, governing law — is a separate document negotiated between those two parties, and nothing on this page adds to it, limits it or replaces it. If you are evaluating ${PRODUCT_NAME} for an institution, ask us for that agreement; it is not this.`,
      },
      {
        heading: 'Your account',
        body: 'Accounts are created for you by your institution. There is no public sign-up, and you cannot create one yourself.',
        items: [
          'The first time you sign in with a password an administrator issued, you have to replace it before you can reach anything else.',
          'Signing in also requires a one-time code sent to your institutional email address.',
          'Your account is yours alone. Do not share your password or let anyone else act under your sign-in — everything done through it is recorded against you.',
          'Tell your institution promptly if you think someone else has used your account.',
        ],
      },
      {
        heading: 'What you may reach',
        body: 'Your role decides what you can see and change, and the system enforces it rather than relying on you to stay in your lane. A student reaches their own record; faculty reach the sections they teach; a department administrator reaches their own department. Attempting to reach another person’s record, another department’s data, or any part of the system your role does not cover is a misuse of your account, whether or not the attempt succeeds.',
      },
      {
        heading: 'Academic records',
        body: 'The records in this system belong to your institution and are its responsibility.',
        items: [
          'Marks are entered by the faculty teaching the course and evaluated under your institution’s own rules.',
          'A course offering can be locked once results are final. After that its marks cannot be edited without an administrator unlocking it, and both the lock and the unlock are recorded.',
          'If something in your record is wrong, raise it with your department — corrections are made at source so that grades and attainment recalculate from the corrected figure.',
          'Attainment percentages, grades and GPA are calculated from the marks held here. They are not entered by hand and cannot be edited directly.',
        ],
      },
      {
        heading: 'Changes are recorded',
        body: 'Every creation, change and deletion of a mark, grade, result or attainment figure is written to an audit trail with the account responsible, what changed, when, and the network address the request came from. This exists because accreditation reviews ask who altered a record and when. It is not optional, and it is visible to administrators at your institution.',
      },
      {
        heading: 'Acceptable use',
        body: 'Beyond staying within your role, do not do any of the following.',
        items: [
          'Interfere with the system’s operation, or attempt to bypass its access controls, rate limits or sign-in checks.',
          'Extract data in bulk beyond what your role provides for, or use automated tools against the system without your institution’s permission.',
          'Upload files you have no right to share, or anything that would put the institution in breach of its own obligations.',
          'Publish or pass on another person’s academic record.',
        ],
      },
      {
        heading: 'Suspension',
        body: 'An account can be made inactive or suspended by your institution, at which point sign-in stops working. That decision is your institution’s, not ours, and questions about it go to your department. Records already in the system are not deleted when an account is suspended.',
      },
      {
        heading: 'If you are answering a survey',
        body: 'Survey invitations carry a single-use link. Do not forward it — it is the credential, and anyone holding it can answer in your place. Giving your name and email on the form is optional. What you submit is used to calculate programme-level attainment and is visible to staff at the institution that invited you.',
      },
      {
        heading: 'Availability and support',
        body: `${PRODUCT_NAME} runs on infrastructure your institution chooses and operates. Availability, maintenance windows and support are therefore matters for your institution in the first instance, and your department or IT support is the right place to start. Any availability commitment made to your institution lives in its agreement with us, not here.`,
      },
      {
        heading: 'Changes to these terms',
        body: 'If the rules above change, this page changes and the date at the top changes with it. Continuing to use the system after that means accepting the revised terms.',
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    intro: `What ${PRODUCT_NAME} stores about students, faculty, administrators and survey respondents — and what it does with it.`,
    draft: false,
    updated: 'August 2026',
    sections: [
      {
        heading: 'Who is responsible for your data',
        body: `Your institution decides what goes into ${PRODUCT_NAME} and who may see it. ${PRODUCT_NAME} holds and processes that data on the institution's instructions and does not use it for any purpose of its own. If you are a student or a member of staff, your institution is the first place to raise a question about your record.`,
      },
      {
        heading: 'What is collected',
        body: 'All of it comes either from your institution or from what you do in the system. Nothing is bought in, and nothing is inferred about you from outside sources.',
        items: [
          'Account details — name, institutional email address, and optionally a phone number and profile picture. Your password is stored only as a bcrypt hash; it is never stored or emailed in readable form.',
          'Enrolment — for students, roll number, programme, department, batch, section and enrolment status.',
          'Academic records — assessment marks including per-question results, rubric scores, grades, GPA, attendance, transcripts, and CLO, LLO, PLO and PEO attainment calculated from them.',
          'Files — attachments uploaded against an assessment or a course file: original filename, type, size, and which account uploaded it.',
          'Messages and preferences — in-app notifications, and the display preferences you set.',
          'Sign-in security — one-time verification codes, password-reset links and failed-attempt counters. These carry an expiry and stop working once it passes.',
          'A record of changes — see the next section.',
        ],
      },
      {
        heading: 'Changes to marks are logged, with your IP address',
        body: 'When a mark, grade, result or attainment figure is created, changed or deleted, the system records which account did it, what changed, when, and the IP address and browser user-agent the request came from. This exists because accreditation reviews ask who altered a student’s record and when, and an answer that cannot be evidenced is not an answer. It applies to staff acting on records — not to ordinary browsing — and administrators at your institution can read it.',
      },
      {
        heading: 'Why it is collected',
        body: 'To run the outcome-based education workflow your institution operates: recording assessments, computing attainment against programme outcomes, and producing the reports an accreditation panel asks for. That is the whole purpose.',
      },
      {
        heading: 'What is not done with it',
        body: 'It is not sold, rented or shared for anyone else’s purposes. There is no advertising. There are no analytics scripts, tracking pixels or third-party cookies in the application — the only cookie set is the one that keeps you signed in.',
      },
      {
        heading: 'Who else receives it',
        body: 'One external service, and only for the messages it has to deliver: the email provider your institution configures. It receives the recipient’s address and the content of that message — account-created notices, sign-in verification codes, password-reset links, survey invitations, and replies to the contact form. No academic records are sent through it beyond what appears in those messages. Everything else stays inside the deployment your institution controls.',
      },
      {
        heading: 'Where it is stored',
        body: 'In a single database, with uploaded files on the same deployment’s storage. Both live wherever your institution has chosen to host the system, which is its decision to make and to tell you about — including whether that location is inside or outside your country.',
      },
      {
        heading: 'How long it is kept',
        body: 'Academic records are kept for as long as your institution’s own retention rules require; they are the reason the system exists, and they outlive a student’s enrolment. Deleting an account removes its dependent records with it. Sign-in codes and reset links expire quickly and cannot be reused afterwards. The retention schedule itself is set by your institution, not by us.',
      },
      {
        heading: 'How it is protected',
        body: 'The measures below are built into the software. They do not replace the ones your institution is responsible for, such as securing the server it runs on.',
        items: [
          'Passwords are hashed with bcrypt and are never recoverable, by anyone, including administrators.',
          'Sign-in requires a one-time code sent to your email address, in addition to your password.',
          'The session cookie is httpOnly and same-site, so scripts cannot read it, and it expires after 24 hours.',
          'Repeated failed sign-in attempts are rate-limited.',
          'Every account has a role, and every request is checked against it — a student cannot reach another student’s record, and a department administrator cannot reach another department’s.',
          'Changes to marks, grades and attainments are written to an audit trail.',
        ],
      },
      {
        heading: 'If you are answering a survey',
        body: 'Alumni and employers are sometimes invited to complete a survey through a link containing a single-use token — no account is created and no password is needed. Giving your name and email address on that form is optional; leave them blank and your answers are recorded without them. The answers are used to calculate programme-level attainment and are visible to staff at the institution that invited you.',
      },
      {
        heading: 'Your rights over your record',
        body: 'Because your institution controls the data, requests go to it rather than to us, and we act on what it instructs.',
        items: [
          'Access — students and staff can see their own record in the portal at any time, and students can download their transcript.',
          'Correction — ask your department administrator; marks and enrolment are corrected at source so the attainment figures recalculate.',
          'Deletion — your institution decides, and may be required to keep academic records regardless of a request.',
          'Objection or complaint — raise it with your institution first; you may also contact your local data protection authority.',
        ],
      },
      {
        heading: 'Changes to this policy',
        body: 'If the system starts collecting something it does not collect today, or starts sending data somewhere it does not send it today, this page changes first and the date at the top changes with it.',
      },
    ],
  },
};

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
          className='inline-flex items-center py-1 text-sm font-medium text-primary hover:underline'
        >
          ← {PRODUCT_NAME}
        </Link>

        <h1 className='text-4xl font-bold mt-8 mb-3 tracking-tight'>
          {entry.title}
        </h1>
        <p className='text-ink-2 text-lg mb-4'>{entry.intro}</p>

        {entry.updated && (
          <p className='text-sm text-ink-muted mb-8'>
            Last updated {entry.updated}.
          </p>
        )}

        {/* The banner is per-document. The privacy policy no longer carries
            it; the terms still do, and should until a lawyer has read them. */}
        {entry.draft && (
          <div className='rounded-lg border border-warn/40 bg-warn-wash p-4 mb-12'>
            <p className='text-sm text-ink font-semibold mb-1'>
              Draft — not yet in force
            </p>
            <p className='text-sm text-ink-2'>
              This document is an outline awaiting legal review. It does not
              create obligations for either party, and no institution should
              rely on it. Contact us for the executed agreement.
            </p>
          </div>
        )}

        <ol className='space-y-10 list-none p-0 m-0'>
          {entry.sections.map((section, i) => (
            <li key={section.heading}>
              <h2 className='text-lg font-semibold mb-2'>
                <span className='text-ink-muted font-mono text-sm mr-3'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {section.heading}
              </h2>
              <div className='pl-10'>
                <p className='text-ink-2 leading-relaxed'>{section.body}</p>
                {section.items && (
                  <ul className='mt-4 space-y-2.5 list-disc pl-5 marker:text-ink-muted'>
                    {section.items.map((item) => (
                      <li key={item} className='text-ink-2 leading-relaxed pl-1'>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
            <>
              {' '}
              should go to your institution first, since it decides what is
              stored and who may see it.
            </>
          )}
        </p>
      </div>
    </main>
  );
}
