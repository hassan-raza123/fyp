'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, GraduationCap, Target } from 'lucide-react';
import { toast } from 'sonner';

interface PLO {
  id: number;
  code: string;
  description: string;
  programId: number;
}

interface CLO {
  id: number;
  code: string;
  description: string;
  ploId: number;
}

interface CLOAttainment {
  cloId: number;
  cloCode: string;
  attainmentPercentage: number;
}

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  totalCLOs: number;
  attainedCLOs: number;
  attainmentPercentage: number;
  isAttained: boolean;
  cloAttainments: CLOAttainment[];
  description: string;
  attainment: number;
  contributingClos: {
    cloId: number;
    cloCode: string;
    attainment: number;
    weight: number;
  }[];
  contributingLlos: {
    lloId: number;
    lloCode: string;
    attainment: number;
    weight: number;
  }[];
}

interface PLOAttainmentsProps {
  programId: number;
  semesterId: number;
}

export function PLOAttainments({ programId, semesterId }: PLOAttainmentsProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [attainments, setAttainments] = useState<PLOAttainment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttainments = async () => {
      try {
        const response = await fetch(
          `/api/plo-attainments?programId=${programId}&semesterId=${semesterId}`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('Failed to fetch PLO attainments');
        const data = await response.json();
        setAttainments(Array.isArray(data) ? data : data?.data ?? []);
      } catch (err) {
        setError('Failed to load PLO attainments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttainments();
  }, [programId, semesterId]);

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        'PLO Code',
        'Description',
        'Attainment %',
        'Contributing CLOs',
      ];
      const rows = attainments.map((plo) => [
        plo.ploCode,
        plo.description,
        `${plo.attainment.toFixed(2)}%`,
        plo.contributingClos
          .map((clo) => `${clo.cloCode} (${clo.attainment.toFixed(2)}%)`)
          .join(', '),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `plo_attainments_${programId}_${semesterId}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PLO attainments exported successfully');
    } catch (err) {
      console.error('Error exporting PLO attainments:', err);
      toast.error('Failed to export PLO attainments');
    }
  };

  if (loading) {
    return (
      <div className='rounded-lg border border-card-border bg-card p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]'>
        <div
          className='w-10 h-10 border-2 border-t-transparent rounded-full animate-spin'
          style={{
            borderTopColor: primaryColor,
            borderRightColor: 'transparent',
            borderBottomColor: primaryColor,
            borderLeftColor: 'transparent',
          }}
        />
        <p className='text-xs text-secondary-text'>Loading PLO attainments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='rounded-lg border border-card-border bg-card p-4'
        style={{ borderColor: 'var(--error-opacity-20)' }}
      >
        <p className='text-xs text-secondary-text' style={{ color: 'var(--error)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (attainments.length === 0) {
    return (
      <div className='rounded-lg border border-card-border bg-card p-8'>
        <div className='text-center text-xs text-secondary-text'>
          No PLO attainments found for the selected program and semester
        </div>
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = attainments.map((plo) => ({
    name: plo.ploCode,
    attainment: Number(plo.attainment.toFixed(2)),
  }));

  return (
    <div className='space-y-4'>
      {/* Top bar: Export button - CLO style */}
      <div className='flex justify-end'>
        <button
          type='button'
          onClick={handleExport}
          className='px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 flex items-center gap-1.5'
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode
              ? 'rgba(252, 153, 40, 0.2)'
              : 'rgba(38, 40, 149, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = iconBgColor;
          }}
        >
          <Download className='w-3.5 h-3.5' />
          Export Report
        </button>
      </div>

      {/* Attainment Overview card - CLO style */}
      <Card className='rounded-lg border border-card-border bg-card overflow-hidden'>
        <CardHeader className='p-4 pb-2'>
          <CardTitle className='text-sm font-bold text-primary-text'>
            Attainment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0'>
          <div className='h-[320px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='var(--border-color)'
                  opacity={0.5}
                />
                <XAxis
                  dataKey='name'
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  stroke='var(--border-color)'
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  stroke='var(--border-color)'
                  label={{
                    value: 'Attainment %',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'var(--text-secondary)', fontSize: 11 },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Attainment']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey='attainment'
                  fill={isDarkMode ? '#fc9928' : '#262895'}
                  name='PLO Attainment'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* PLO summary cards - CLO style */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {attainments.map((plo) => (
          <Card
            key={plo.ploId}
            className='rounded-lg border border-card-border bg-card overflow-hidden hover:bg-hover-bg transition-colors'
          >
            <CardHeader className='p-4 pb-2'>
              <CardTitle className='flex items-center gap-3 text-sm font-bold text-primary-text'>
                <span
                  className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'
                  style={{ backgroundColor: iconBgColor }}
                >
                  <Target
                    className='h-4 w-4'
                    style={{ color: primaryColor }}
                  />
                </span>
                <span className='truncate'>
                  {plo.ploCode} — {plo.description}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0 space-y-4'>
              <div>
                <p className='text-[10px] text-secondary-text mb-0.5'>
                  Overall Attainment
                </p>
                <p
                  className='text-xl font-bold text-primary-text'
                  style={{ color: primaryColor }}
                >
                  {plo.attainment.toFixed(2)}%
                </p>
              </div>
              {plo.contributingClos?.length > 0 && (
                <div>
                  <p className='text-[10px] text-secondary-text mb-2'>
                    Contributing CLOs
                  </p>
                  <div className='space-y-1.5'>
                    {plo.contributingClos.map((clo) => (
                      <div
                        key={clo.cloId}
                        className='flex justify-between items-center text-xs text-primary-text'
                      >
                        <span>{clo.cloCode}</span>
                        <span className='font-medium text-secondary-text'>
                          {clo.attainment.toFixed(2)}% (W: {clo.weight})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {plo.contributingLlos?.length > 0 && (
                <div>
                  <p className='text-[10px] text-secondary-text mb-2'>
                    Contributing LLOs (Lab)
                  </p>
                  <div className='space-y-1.5'>
                    {plo.contributingLlos.map((llo) => (
                      <div
                        key={llo.lloId}
                        className='flex justify-between items-center text-xs text-primary-text'
                      >
                        <span>{llo.lloCode}</span>
                        <span className='font-medium text-secondary-text'>
                          {llo.attainment.toFixed(2)}% (W: {llo.weight})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
