'use client';

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
}

interface PLOAttainmentsProps {
  programId: number;
  semesterId: number;
}

export function PLOAttainments({ programId, semesterId }: PLOAttainmentsProps) {
  const [attainments, setAttainments] = useState<PLOAttainment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttainments = async () => {
      try {
        const response = await fetch(
          `/api/plo-attainments?programId=${programId}&semesterId=${semesterId}`
        );
        if (!response.ok) throw new Error('Failed to fetch PLO attainments');
        const data = await response.json();
        setAttainments(data);
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
    return <Loading message='Loading PLO attainments...' />;
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (attainments.length === 0) {
    return (
      <div className='text-center text-gray-500 py-4'>
        No PLO attainments found for the selected program and semester
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = attainments.map((plo) => ({
    name: plo.ploCode,
    attainment: Number(plo.attainment.toFixed(2)),
  }));

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>PLO Attainments</h2>
        <Button onClick={handleExport} variant='outline'>
          <Download className='h-4 w-4 mr-2' />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attainment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[400px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis
                  domain={[0, 100]}
                  label={{
                    value: 'Attainment %',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Attainment']}
                />
                <Legend />
                <Bar
                  dataKey='attainment'
                  fill='#4f46e5'
                  name='PLO Attainment'
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {attainments.map((plo) => (
          <Card key={plo.ploId}>
            <CardHeader>
              <CardTitle className='text-lg'>
                {plo.ploCode} - {plo.description}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Overall Attainment
                  </p>
                  <p className='text-2xl font-bold'>
                    {plo.attainment.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500 mb-2'>
                    Contributing CLOs
                  </p>
                  <div className='space-y-2'>
                    {plo.contributingClos.map((clo) => (
                      <div
                        key={clo.cloId}
                        className='flex justify-between items-center text-sm'
                      >
                        <span>{clo.cloCode}</span>
                        <span className='font-medium'>
                          {clo.attainment.toFixed(2)}% (Weight: {clo.weight})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
