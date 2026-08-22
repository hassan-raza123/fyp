import { BarChart3 } from 'lucide-react';

/**
 * Placeholder for a chart with nothing to plot.
 *
 * Charts on a fresh installation were rendering their axes over an empty plot
 * — a flat line pinned at zero, or a pie with no slices and no legend. Both
 * read as "this is broken" rather than "there is no data yet", which is the
 * first impression a new customer gets on day one.
 *
 * The hint says what will make the chart appear, so the reader knows it is a
 * setup step rather than a fault.
 */
export function EmptyChart({
  height = 220,
  message,
  hint,
}: {
  height?: number;
  message: string;
  hint?: string;
}) {
  return (
    <div
      className='flex flex-col items-center justify-center text-center gap-2 rounded-lg border border-dashed border-subtle'
      style={{ height }}
      role='status'
    >
      <BarChart3 className='w-6 h-6 text-ink-muted' aria-hidden='true' />
      <p className='text-sm font-medium text-ink-2'>{message}</p>
      {hint && <p className='text-xs text-ink-muted max-w-[38ch]'>{hint}</p>}
    </div>
  );
}
