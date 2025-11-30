
export interface ProgressBarProps  {
    current: number;
    target: number;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  };

  export interface MiniStatsCardProps {
    stat : {
    color: string;
    title: string;
    value: string | number;
    detail: string;
    icon: React.ElementType;
    trend: number[];
    change: string;
    }
  }

  export interface TimelineProps {
    items: {
      date: string;
      time: string;
      title: string;
      description: string;
      color: string;
      icon: React.ElementType;
    }[];
  }