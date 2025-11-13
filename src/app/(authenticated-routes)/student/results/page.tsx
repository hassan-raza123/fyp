'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Target,
  Award,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Grade {
  id: number;
  courseOffering: {
    course: {
      code: string;
      name: string;
      creditHours: number;
    };
    semester: {
      name: string;
    };
  };
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  gpaPoints: number;
  creditHours: number;
  qualityPoints: number;
}

export default function ResultsPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [semesters, setSemesters] = useState<any[]>([]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSemesters(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSemester !== 'all') {
        params.append('semesterId', selectedSemester);
      }

      const response = await fetch(
        `/api/student/grades?${params.toString()}`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch grades');
      const result = await response.json();
      if (result.success) {
        setGrades(result.data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-800';
    if (['B+', 'B'].includes(grade)) return 'bg-blue-100 text-blue-800';
    if (['C+', 'C'].includes(grade)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>My Results</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <Link href='/student/results/clo-attainments'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                My CLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                View my Course Learning Outcomes achievement
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/student/results/plo-attainments'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <GraduationCap className='h-5 w-5' />
                My PLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                View my Program Learning Outcomes achievement
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Award className='h-5 w-5' />
              My Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-500'>
              View all your course grades and GPA
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle>Course Grades</CardTitle>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Filter by semester' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Semesters</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-4'>Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className='text-center py-4 text-gray-500'>
              No grades available yet
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credit Hours</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>GPA Points</TableHead>
                    <TableHead>Quality Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className='font-medium'>
                        {grade.courseOffering.course.code}
                      </TableCell>
                      <TableCell>{grade.courseOffering.course.name}</TableCell>
                      <TableCell>{grade.courseOffering.semester.name}</TableCell>
                      <TableCell>{grade.creditHours}</TableCell>
                      <TableCell>
                        {grade.obtainedMarks.toFixed(1)} /{' '}
                        {grade.totalMarks.toFixed(1)}
                      </TableCell>
                      <TableCell>{grade.percentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge
                          className={getGradeBadgeColor(grade.grade)}
                        >
                          {grade.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>{grade.gpaPoints.toFixed(2)}</TableCell>
                      <TableCell>{grade.qualityPoints.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
