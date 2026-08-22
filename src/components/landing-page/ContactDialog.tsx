'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ContactForm from '@/components/forms/ContactForm';

/**
 * The contact form, in a dialog, behind whatever trigger the caller passes.
 *
 * The dialog and its copy used to live inside FloatingChatButton, which meant
 * the only way to reach the contact form was the floating bubble in the
 * corner. Every other call to action on the page said "sign in" — fine for
 * the students and faculty of an institution that already runs the product,
 * and a dead end for anyone evaluating it for theirs.
 */
export default function ContactDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-ink'>
            Talk to us
          </DialogTitle>
          <DialogDescription className='text-base text-ink-2'>
            Tell us about your programmes and what your accreditation cycle
            looks like. We will get back to you.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-4'>
          <ContactForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
