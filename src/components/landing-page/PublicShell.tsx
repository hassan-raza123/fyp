import NavbarClient from './NavbarClient';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';

/**
 * Navbar and footer for the public pages that are not the landing page.
 *
 * The legal pages, the 404 and the error screen each rendered as a bare
 * `<main>` on the page background — no header, no footer, no way back into
 * the site and nothing identifying whose product they belonged to. The two
 * legal documents are linked from the footer and are the first thing a
 * university's procurement office opens, and they opened as an unbranded wall
 * of text.
 *
 * `solid` on the navbar because these pages have no hero: the bar's default
 * is transparent-with-white-type until the page scrolls, which on a light
 * page means invisible until you scroll.
 */
export default function PublicShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <NavbarClient solid />

      {/* Clears the fixed 80px navbar. */}
      <main className='flex-1 pt-20'>{children}</main>

      <Footer />
      <BackToTopButton />
    </div>
  );
}
