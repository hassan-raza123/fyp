import React, { useEffect, useState } from 'react';
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

interface ResultAnalyticsProps {
  sectionId: number;
  assessmentId: number;
}

interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

interface PerformanceMetrics {
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passRate: number;
  totalStudents: number;
}

export const ResultAnalytics: React.FC<ResultAnalyticsProps> = ({
  sectionId,
  assessmentId,
}) => {
  const [loading, setLoading] = useState(true);
  const [gradeDistribution, setGradeDistribution] = useState<
    GradeDistribution[]
  >([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/assessment-results/analytics?sectionId=${sectionId}&assessmentId=${assessmentId}`
        );
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setGradeDistribution(data.gradeDistribution);
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sectionId, assessmentId]);

  if (loading) {
    return <div className='text-center py-4'>Loading analytics...</div>;
  }

  if (!metrics) {
    return <div className='text-center py-4'>No data available</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white p-4 rounded-lg shadow'>
          <h3 className='text-sm font-medium text-gray-500'>Average Marks</h3>
          <p className='text-2xl font-semibold'>
            {metrics.averageMarks.toFixed(1)}
          </p>
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <h3 className='text-sm font-medium text-gray-500'>Highest Marks</h3>
          <p className='text-2xl font-semibold'>
            {metrics.highestMarks.toFixed(1)}
          </p>
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <h3 className='text-sm font-medium text-gray-500'>Lowest Marks</h3>
          <p className='text-2xl font-semibold'>
            {metrics.lowestMarks.toFixed(1)}
          </p>
        </div>
        <div className='bg-white p-4 rounded-lg shadow'>
          <h3 className='text-sm font-medium text-gray-500'>Pass Rate</h3>
          <p className='text-2xl font-semibold'>
            {metrics.passRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className='bg-white p-4 rounded-lg shadow'>
        <h3 className='text-lg font-semibold mb-4'>Grade Distribution</h3>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='grade' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='count' fill='#3b82f6' name='Number of Students' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='bg-white p-4 rounded-lg shadow'>
        <h3 className='text-lg font-semibold mb-4'>
          Detailed Grade Distribution
        </h3>
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr>
                <th className='px-4 py-2 text-left'>Grade</th>
                <th className='px-4 py-2 text-left'>Count</th>
                <th className='px-4 py-2 text-left'>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {gradeDistribution.map((grade) => (
                <tr key={grade.grade}>
                  <td className='px-4 py-2'>{grade.grade}</td>
                  <td className='px-4 py-2'>{grade.count}</td>
                  <td className='px-4 py-2'>{grade.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
