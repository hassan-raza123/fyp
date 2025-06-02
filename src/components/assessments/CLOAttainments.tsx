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

interface CLO {
  id: number;
  code: string;
  description: string;
  bloomLevel: string;
}

interface AssessmentItem {
  id: number;
  questionNo: string;
  marks: number;
  cloId: number;
}

interface AssessmentResult {
  id: number;
  studentId: number;
  obtainedMarks: number;
  totalMarks: number;
  items: {
    itemId: number;
    marks: number;
    totalMarks: number;
  }[];
}

interface CLOAttainment {
  cloId: number;
  cloCode: string;
  totalStudents: number;
  achievedStudents: number;
  attainmentPercentage: number;
  isAttained: boolean;
}

interface CLOAttainmentsProps {
  sectionId: number;
  courseId: number;
}

export const CLOAttainments: React.FC<CLOAttainmentsProps> = ({
  sectionId,
  courseId,
}) => {
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [attainments, setAttainments] = useState<CLOAttainment[]>([]);
  const [threshold, setThreshold] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch CLOs for the course
  useEffect(() => {
    const fetchCLOs = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/clos`);
        if (!response.ok) throw new Error('Failed to fetch CLOs');
        const data = await response.json();
        setCLOs(data);
      } catch (err) {
        setError('Failed to load CLOs');
        console.error(err);
      }
    };
    fetchCLOs();
  }, [courseId]);

  // Fetch assessment items and results
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch assessment items
        const itemsResponse = await fetch(
          `/api/sections/${sectionId}/assessment-items`
        );
        if (!itemsResponse.ok)
          throw new Error('Failed to fetch assessment items');
        const itemsData = await itemsResponse.json();
        setAssessmentItems(itemsData);

        // Fetch assessment results
        const resultsResponse = await fetch(
          `/api/sections/${sectionId}/assessment-results`
        );
        if (!resultsResponse.ok) throw new Error('Failed to fetch results');
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) {
      fetchData();
    }
  }, [sectionId]);

  // Calculate CLO attainments
  useEffect(() => {
    if (!clos?.length || !assessmentItems?.length || !results?.length) {
      setAttainments([]);
      return;
    }

    const calculateAttainments = () => {
      try {
        const attainmentData: CLOAttainment[] = clos.map((clo) => {
          // Get all items for this CLO
          const cloItems = assessmentItems.filter(
            (item) => item.cloId === clo.id
          );

          if (!cloItems.length) {
            return {
              cloId: clo.id,
              cloCode: clo.code,
              totalStudents: 0,
              achievedStudents: 0,
              attainmentPercentage: 0,
              isAttained: false,
            };
          }

          // Calculate total possible marks for this CLO
          const totalPossibleMarks = cloItems.reduce(
            (sum, item) => sum + item.marks,
            0
          );

          // Count students who achieved the threshold
          let achievedStudents = 0;
          const totalStudents = results.length;

          results.forEach((result) => {
            if (!result.items) return;

            // Calculate total marks obtained for this CLO
            const obtainedMarks = result.items
              .filter((item) =>
                cloItems.some((cloItem) => cloItem.id === item.itemId)
              )
              .reduce((sum, item) => sum + item.marks, 0);

            // Check if student achieved the threshold
            const percentage = (obtainedMarks / totalPossibleMarks) * 100;
            if (percentage >= threshold) {
              achievedStudents++;
            }
          });

          const attainmentPercentage = (achievedStudents / totalStudents) * 100;

          return {
            cloId: clo.id,
            cloCode: clo.code,
            totalStudents,
            achievedStudents,
            attainmentPercentage,
            isAttained: attainmentPercentage >= threshold,
          };
        });

        setAttainments(attainmentData);
      } catch (err) {
        console.error('Error calculating attainments:', err);
        setError('Failed to calculate CLO attainments');
      }
    };

    calculateAttainments();
  }, [clos, assessmentItems, results, threshold]);

  const handleThresholdChange = (value: string) => {
    const newThreshold = parseFloat(value);
    if (!isNaN(newThreshold) && newThreshold >= 0 && newThreshold <= 100) {
      setThreshold(newThreshold);
    }
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = [
        'CLO Code',
        'Total Students',
        'Achieved Students',
        'Attainment %',
        'Status',
      ];
      const rows = attainments.map((attainment) => [
        attainment.cloCode,
        attainment.totalStudents,
        attainment.achievedStudents,
        attainment.attainmentPercentage.toFixed(1),
        attainment.isAttained ? 'Attained' : 'Not Attained',
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
      link.setAttribute('download', `clo_attainments_${sectionId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CLO attainments report downloaded successfully');
    } catch (error) {
      console.error('Error exporting CLO attainments:', error);
      toast.error('Failed to export CLO attainments');
    }
  };

  if (loading) {
    return <Loading message='Loading CLO attainments...' />;
  }

  if (error) {
    return <div className='text-red-600 p-4'>{error}</div>;
  }

  if (!attainments.length) {
    return (
      <div className='text-center text-gray-500 py-4'>
        No CLO attainments data available
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Label htmlFor='threshold'>Attainment Threshold (%)</Label>
          <Input
            id='threshold'
            type='number'
            min='0'
            max='100'
            value={threshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
            className='w-24'
          />
        </div>
        <Button onClick={handleExport} className='flex items-center gap-2'>
          <Download className='h-4 w-4' />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CLO Attainment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-[400px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={attainments}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='cloCode' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey='attainmentPercentage'
                  name='Attainment %'
                  fill='#4f46e5'
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {attainments.map((attainment) => (
          <Card
            key={attainment.cloId}
            className={`${
              attainment.isAttained ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <CardHeader>
              <CardTitle className='text-lg'>{attainment.cloCode}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Attainment:</span>
                  <span
                    className={
                      attainment.isAttained ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {attainment.attainmentPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Students Achieved:</span>
                  <span>
                    {attainment.achievedStudents} / {attainment.totalStudents}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Status:</span>
                  <span
                    className={
                      attainment.isAttained ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {attainment.isAttained ? 'Attained' : 'Not Attained'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
