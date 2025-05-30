import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: 'single' | 'multiple' | 'range';
  initialFocus?: boolean;
}

export function Calendar({
  selected,
  onSelect,
  mode = 'single',
  initialFocus,
}: CalendarProps) {
  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      initialFocus={initialFocus}
    />
  );
}
