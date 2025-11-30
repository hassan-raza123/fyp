'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  FileText,
  Target,
  Award,
  Download,
  Filter,
} from 'lucide-react';

// Chart components (you'll need to install and import these)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  enrollmentTrend: { month: string; students: number }[];
  programDistribution: { name: string; value: number }[];
  gpaDistribution: { gpa: number; students: number }[];
  stats: {
    totalEnrollment: number;
    programCompletion: number;
    averageGPA: number;
    retentionRate: number;
  };
}

// Using theme colors - blue shades and orange
const COLORS = ['#262895', '#433ea7', '#1c1e74', '#fc9928', '#e6891f'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
  isDarkMode?: boolean;
}

const StatCard = ({ title, value, icon, change, trend, isDarkMode = false }: StatCardProps) => {
  const iconBgColor = isDarkMode 
    ? 'rgba(252, 153, 40, 0.15)' 
    : 'rgba(38, 40, 149, 0.15)';
  const iconColor = isDarkMode 
    ? 'var(--orange)' 
    : 'var(--blue)';
  
  return (
    <div className='bg-card border-card-border rounded-xl p-6 shadow-sm border transition-all duration-200 hover:shadow-md'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-secondary-text'>
            {title}
          </p>
          <h3 className='text-2xl font-bold mt-1 text-primary-text'>
            {value}
          </h3>
          {change !== undefined && (
            <div className='flex items-center mt-2'>
              <span
                className='text-sm font-medium'
                style={{
                  color: trend === 'up' ? 'var(--success-green)' : 'var(--error)',
                }}
              >
                {trend === 'up' ? (
                  <ArrowUpRight className='inline w-4 h-4' />
                ) : (
                  <ArrowDownRight className='inline w-4 h-4' />
                )}
                {change}%
              </span>
              <span className='text-sm text-muted-text ml-2'>
                vs last month
              </span>
            </div>
          )}
        </div>
        <div 
          className='p-3 rounded-lg transition-transform duration-200 hover:scale-110'
          style={{
            backgroundColor: iconBgColor,
          }}
        >
          <div style={{ color: iconColor }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted || loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-page'>
        <div className="flex flex-col items-center space-y-3">
          <div 
            className='w-10 h-10 border-2 border-t-transparent rounded-full animate-spin'
            style={{
              borderTopColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
              borderBottomColor: isDarkMode ? 'var(--orange)' : 'var(--blue)',
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          ></div>
          <p className="text-sm text-secondary-text">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-page'>
        <div className="text-center">
          <div className='text-lg font-semibold mb-2' style={{ color: 'var(--error)' }}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;
  
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';

  // GPA buckets for bar chart
  const gpaBuckets = [4, 3.5, 3, 2.5, 2, 0];
  const gpaBarData = gpaBuckets.slice(0, -1).map((gpa, i) => {
    const count = data.gpaDistribution
      .filter((d) => d.gpa >= gpaBuckets[i + 1] && d.gpa < gpa)
      .reduce((sum, d) => sum + d.students, 0);
    return {
      range: `${gpaBuckets[i + 1].toFixed(1)}-${gpa.toFixed(1)}`,
      students: count,
    };
  });

  // Program completion percentage
  const programCompletionPercent = data.stats.totalEnrollment
    ? Math.round(
        (data.stats.programCompletion / data.stats.totalEnrollment) * 100
      )
    : 0;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-primary-text'>
            Analytics Dashboard
          </h1>
          <p className='text-secondary-text'>
            Comprehensive insights and statistics
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <button 
            className='px-4 py-2 rounded-lg transition-colors'
            style={{
              backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              color: primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)';
            }}
          >
            <Filter className='w-4 h-4 inline mr-2' />
            Filter
          </button>
          <button 
            className='px-4 py-2 rounded-lg transition-colors'
            style={{
              backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              color: primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)';
            }}
          >
            <Download className='w-4 h-4 inline mr-2' />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Enrollment'
          value={data.stats.totalEnrollment.toLocaleString()}
          icon={<Users className='w-6 h-6' />}
          change={12}
          trend='up'
          isDarkMode={isDarkMode}
        />
        <StatCard
          title='Program Completion'
          value={programCompletionPercent + '%'}
          icon={<GraduationCap className='w-6 h-6' />}
          change={5}
          trend='up'
          isDarkMode={isDarkMode}
        />
        <StatCard
          title='Average GPA'
          value={data.stats.averageGPA.toFixed(2)}
          icon={<BarChart2 className='w-6 h-6' />}
          change={2}
          trend='up'
          isDarkMode={isDarkMode}
        />
        <StatCard
          title='Retention Rate'
          value={Math.round(data.stats.retentionRate * 100) + '%'}
          icon={<TrendingUp className='w-6 h-6' />}
          change={3}
          trend='up'
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Enrollment Trend */}
        <div className='bg-card border-card-border rounded-xl shadow-sm border p-6'>
          <h2 className='text-lg font-semibold text-primary-text mb-4'>
            Enrollment Trend
          </h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data.enrollmentTrend}>
                <CartesianGrid strokeDasharray='3 3' stroke={isDarkMode ? '#404040' : '#e5e5e5'} opacity={0.2} />
                <XAxis 
                  dataKey='month' 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }}
                  stroke={isDarkMode ? '#525252' : '#d4d4d4'}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#a3a3a3' : '#737373' }}
                  stroke={isDarkMode ? '#525252' : '#d4d4d4'}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#171717' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#404040' : '#e5e5e5'}`,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ 
                    color: isDarkMode ? '#ffffff' : '#000000',
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='students'
                  stroke={primaryColor}
                  strokeWidth={3}
                  dot={{ fill: primaryColor, r: 4, strokeWidth: 2, stroke: isDarkMode ? '#171717' : '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Distribution */}
        <div className='bg-card border-card-border rounded-xl shadow-sm border p-6'>
          <h2 className='text-lg font-semibold text-primary-text mb-4'>
            Program Distribution
          </h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={data.programDistribution}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={80}
                  fill='#8884d8'
                  paddingAngle={5}
                  dataKey='value'
                >
                  {data.programDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className='grid grid-cols-2 gap-4 mt-4'>
            {data.programDistribution.map((program, index) => (
              <div key={program.name} className='flex items-center space-x-2'>
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className='text-sm text-secondary-text'>
                  {program.name}
                </span>
                <span className='text-sm font-medium text-primary-text'>
                  {program.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GPA Distribution */}
        <div className='bg-card border-card-border rounded-xl shadow-sm border p-6'>
          <h2 className='text-lg font-semibold text-primary-text mb-4'>
            GPA Distribution
          </h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={gpaBarData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='range' stroke='#6B7280' />
                <YAxis stroke='#6B7280' />
                <Tooltip />
                <Bar dataKey='students' fill={primaryColor} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='bg-card border-card-border rounded-xl shadow-sm border p-6'>
          <h2 className='text-lg font-semibold text-primary-text mb-4'>
            Key Metrics
          </h2>
          <div className='space-y-4'>
            <div 
              className='flex items-center justify-between p-4 rounded-lg'
              style={{
                backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              }}
            >
              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5' style={{ color: primaryColor }} />
                <span className='text-sm text-secondary-text'>
                  Current Semester
                </span>
              </div>
              <span className='text-sm font-medium text-primary-text'>
                -
              </span>
            </div>
            <div 
              className='flex items-center justify-between p-4 rounded-lg'
              style={{
                backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              }}
            >
              <div className='flex items-center space-x-3'>
                <Target className='w-5 h-5' style={{ color: primaryColor }} />
                <span className='text-sm text-secondary-text'>
                  Program Success Rate
                </span>
              </div>
              <span className='text-sm font-medium text-primary-text'>
                {programCompletionPercent}%
              </span>
            </div>
            <div 
              className='flex items-center justify-between p-4 rounded-lg'
              style={{
                backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.1)' : 'rgba(38, 40, 149, 0.1)',
              }}
            >
              <div className='flex items-center space-x-3'>
                <Award className='w-5 h-5' style={{ color: primaryColor }} />
                <span className='text-sm text-secondary-text'>
                  Top Performing Program
                </span>
              </div>
              <span className='text-sm font-medium text-primary-text'>
                {data.programDistribution.length > 0
                  ? data.programDistribution.reduce((a, b) =>
                      a.value > b.value ? a : b
                    ).name
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
