import type { Metadata } from 'next';
import { PRODUCT_NAME } from '@/constants/branding';

/**
 * The survey page is a client component and so cannot export metadata itself.
 * Without this it inherited the root layout's title — the marketing strapline,
 * "Attainly — Outcome-Based Education Management" — on a page an employer or
 * an alumnus opens from an emailed link. That is the text that appeared in
 * their tab, their history and any link preview.
 *
 * The survey's own title is only known after the token is exchanged, on the
 * client, so it cannot be used here; naming the page for what it is beats
 * naming it after the product's sales line.
 */
export const metadata: Metadata = {
  title: `Survey | ${PRODUCT_NAME}`,
  description: 'Complete the survey you were invited to.',
  // An emailed survey link should not turn up in search results.
  robots: { index: false, follow: false },
};

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
