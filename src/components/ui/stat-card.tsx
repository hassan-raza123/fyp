import * as React from 'react';

/**
 * A single headline number on a dashboard.
 *
 * Replaces per-page copies that each wrapped their icon in a 40px tinted
 * square. Four of those across a row spent most of the card on decoration and
 * pushed the number — the only thing anyone reads — down and to the left.
 *
 * Here the number leads at the size it deserves, the icon sits quietly beside
 * the label, and the whole card is shorter, so a row of stats stops dominating
 * the page.
 */
export interface StatCardProps {
  label: string;
  value: string | number;
  /** Small qualifier under the number: "Total enrolled", "0 unassigned". */
  hint?: string;
  icon?: React.ReactNode;
  /**
   * Only pass a real, computed delta. A hardcoded one shipped on this
   * dashboard for months, telling every installation it had grown 8%.
   */
  trend?: { value: number; label: string };
}

export function StatCard({ label, value, hint, icon, trend }: StatCardProps) {
  return (
    <div className='rounded-lg border border-subtle bg-card px-4 py-3.5 transition-colors hover:border-firm'>
      <div className='flex items-center gap-2 mb-2'>
        {icon && (
          <span className='text-ink-muted [&>svg]:w-3.5 [&>svg]:h-3.5' aria-hidden='true'>
            {icon}
          </span>
        )}
        <p className='text-[11px] font-medium uppercase tracking-wider text-ink-muted'>
          {label}
        </p>
      </div>

      <p className='text-[28px] leading-none font-semibold tracking-tight text-ink tabular-nums'>
        {value}
      </p>

      <div className='mt-2 flex items-center gap-2 min-h-[16px]'>
        {trend && (
          <span
            className={`text-[11px] font-semibold tabular-nums ${
              trend.value >= 0 ? 'text-good' : 'text-bad'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}%
          </span>
        )}
        {(hint || trend) && (
          <span className='text-[11px] text-ink-muted truncate'>
            {trend ? trend.label : hint}
          </span>
        )}
      </div>
    </div>
  );
}
