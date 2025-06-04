import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface AttendanceReportProps {
  sectionId: number;
  onClose: () => void;
}

interface StudentAttendance {
  studentSectionId: number;
  studentId: number;
  name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

const COLORS = ['#22c55e', '#ef4444', '#eab308'];

export const AttendanceReport: React.FC<AttendanceReportProps> = ({
  sectionId,
  onClose,
}) => {
  const [data, setData] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    averageAttendance: 0,
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/attendance?sectionId=${sectionId}&report=1`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setData(res.data);

          // Calculate summary statistics
          const summary = res.data.reduce(
            (acc: any, student: StudentAttendance) => {
              acc.totalPresent += student.present;
              acc.totalAbsent += student.absent;
              acc.totalLate += student.late;
              return acc;
            },
            { totalPresent: 0, totalAbsent: 0, totalLate: 0 }
          );

          const totalAttendance =
            summary.totalPresent + summary.totalAbsent + summary.totalLate;
          summary.averageAttendance =
            totalAttendance > 0
              ? (summary.totalPresent / totalAttendance) * 100
              : 0;

          setSummary(summary);
        } else {
          setError('Failed to fetch attendance report');
        }
      })
      .catch(() => setError('Failed to fetch attendance report'))
      .finally(() => setLoading(false));
  }, [sectionId]);

  const handleExport = () => {
    const headers = [
      'Name',
      'Present',
      'Absent',
      'Late',
      'Total Sessions',
      'Attendance %',
    ];
    const rows = data.map((row) => [
      row.name,
      row.present,
      row.absent,
      row.late,
      row.total,
      ((row.present / (row.total || 1)) * 100).toFixed(1),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_section_${sectionId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieData = [
    { name: 'Present', value: summary.totalPresent },
    { name: 'Absent', value: summary.totalAbsent },
    { name: 'Late', value: summary.totalLate },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30'>
      <Card className='w-full max-w-4xl max-h-[90vh] overflow-y-auto relative'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Attendance Report</CardTitle>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X className='h-5 w-5' />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading message='Loading attendance report...' />
          ) : error ? (
            <div className='text-red-500'>{error}</div>
          ) : (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                {/* Summary Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      Summary Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-sm text-gray-500'>Total Present</p>
                          <p className='text-2xl font-bold text-green-600'>
                            {summary.totalPresent}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>Total Absent</p>
                          <p className='text-2xl font-bold text-red-600'>
                            {summary.totalAbsent}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>Total Late</p>
                          <p className='text-2xl font-bold text-yellow-600'>
                            {summary.totalLate}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>
                            Average Attendance
                          </p>
                          <p className='text-2xl font-bold text-blue-600'>
                            {summary.averageAttendance.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      Attendance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='h-[200px]'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            outerRadius={80}
                            fill='#8884d8'
                            dataKey='value'
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='flex justify-end mb-4'>
                <Button onClick={handleExport} variant='outline' size='sm'>
                  <Download className='h-4 w-4 mr-2' /> Export CSV
                </Button>
              </div>

              <div className='overflow-x-auto'>
                <table className='min-w-full border text-sm'>
                  <thead>
                    <tr className='bg-gray-100'>
                      <th className='px-2 py-1 border'>#</th>
                      <th className='px-2 py-1 border'>Name</th>
                      <th className='px-2 py-1 border'>Present</th>
                      <th className='px-2 py-1 border'>Absent</th>
                      <th className='px-2 py-1 border'>Late</th>
                      <th className='px-2 py-1 border'>Total Sessions</th>
                      <th className='px-2 py-1 border'>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr key={row.studentSectionId}>
                        <td className='px-2 py-1 border'>{idx + 1}</td>
                        <td className='px-2 py-1 border'>{row.name}</td>
                        <td className='px-2 py-1 border text-green-700'>
                          {row.present}
                        </td>
                        <td className='px-2 py-1 border text-red-600'>
                          {row.absent}
                        </td>
                        <td className='px-2 py-1 border text-yellow-600'>
                          {row.late}
                        </td>
                        <td className='px-2 py-1 border'>{row.total}</td>
                        <td className='px-2 py-1 border font-semibold'>
                          {((row.present / (row.total || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
