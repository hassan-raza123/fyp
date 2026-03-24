import { LucideIcon } from 'lucide-react';

export interface MiniStatsCardProps {
  stat: {
    title: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
    trend: number[];
    change: string;
    color: string;
    iconBgColor: string;
    iconColor: string;
  };
}

export interface ProgressBarProps {
  current: number;
  target: number;
  color: string;
}

export interface TimelineProps {
  items: Array<{
    title: string;
    time: string;
    description: string;
    icon: LucideIcon;
    color: string;
  }>;
} 