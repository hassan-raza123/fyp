'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Target, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface CLO {
  id: number;
  code: string;
  description: string;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  courseId: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface CLOAttainment {
  clo: {
    id: number;
    code: string;
    description: string;
    bloomLevel: string | null;
  };
  latestAttainment: {
    attainmentPercent: number;
    threshold: number;
    status: 'attained' | 'not_attained';
    semester: string;
    sectionName: string | null;
  } | null;
  averageAttainment: number | null;
  sectionWiseBreakdown: Array<{
    semester: string;
    sectionName: string | null;
    attainmentPercent: number;
    threshold: number;
    status: 'attained' | 'not_attained';
    totalStudents: number;
    studentsAchieved: number;
    calculatedAt: string;
  }>;
}

interface CLOPLOMapping {
  clo: {
    id: number;
    code: string;
    description: string;
  };
  ploMappings: Array<{
    ploId: number;
    ploCode: string;
    ploDescription: string;
    programName: string;
    programCode: string;
    weight: number;
  }>;
}

export default function CourseCLOsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [attainments, setAttainments] = useState<CLOAttainment[]>([]);
  const [ploMappings, setPLOMappings] = useState<CLOPLOMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [closRes, courseRes, attainmentsRes, mappingsRes] =
        await Promise.all([
          fetch(`/api/courses/${courseId}/clos`, { credentials: 'include' }),
          fetch(`/api/courses/${courseId}`, { credentials: 'include' }),
          fetch(`/api/courses/${courseId}/clos/attainments`, {
            credentials: 'include',
          }),
          fetch(`/api/courses/${courseId}/clos/plo-mappings`, {
            credentials: 'include',
          }),
        ]);

      const [closData, courseData, attainmentsData, mappingsData] =
        await Promise.all([
          closRes.json(),
          courseRes.json(),
          attainmentsRes.json(),
          mappingsRes.json(),
        ]);

      if (!closData.success || !courseData.success) {
        throw new Error(
          closData.error || courseData.error || 'Failed to fetch data'
        );
      }

      setCLOs(closData.data);
      setCourse(courseData.data);

      if (attainmentsData.success) {
        setAttainments(attainmentsData.data);
      }

      if (mappingsData.success) {
        setPLOMappings(mappingsData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const getStatusBadge = (status: 'attained' | 'not_attained') => {
    if (status === 'attained') {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Attained</Badge>
      );
    }
    return (
      <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
        Not Attained
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading CLOs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/faculty/courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            CLOs for {course?.name} ({course?.code})
          </h1>
          <p className="text-muted-foreground">
            View Course Learning Outcomes and their attainment status
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">CLO List</TabsTrigger>
          <TabsTrigger value="attainments">CLO Attainments</TabsTrigger>
          <TabsTrigger value="plo-mappings">CLO-PLO Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bloom's Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No CLOs defined for this course
                      </TableCell>
                    </TableRow>
                  ) : (
                    clos.map((clo) => (
                      <TableRow key={clo.id}>
                        <TableCell className="font-medium">{clo.code}</TableCell>
                        <TableCell>{clo.description}</TableCell>
                        <TableCell>{clo.bloomLevel || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              clo.status === 'active'
                                ? 'default'
                                : clo.status === 'inactive'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {clo.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attainments" className="space-y-4">
          {attainments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No CLO attainments calculated yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Calculate CLO attainments from the Results section
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {attainments.map((item) => (
                <Card key={item.clo.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          {item.clo.code}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.clo.description}
                        </p>
                      </div>
                      {item.latestAttainment && (
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.latestAttainment.status)}
                            <span className="text-2xl font-bold">
                              {item.latestAttainment.attainmentPercent.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Threshold: {item.latestAttainment.threshold}%
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.latestAttainment && (
                      <div className="mb-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Latest Attainment
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.latestAttainment.semester}
                              {item.latestAttainment.sectionName &&
                                ` • ${item.latestAttainment.sectionName}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {item.latestAttainment.attainmentPercent.toFixed(1)}%
                            </p>
                            {item.averageAttainment && (
                              <p className="text-xs text-muted-foreground">
                                Avg: {item.averageAttainment.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {item.sectionWiseBreakdown.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3">
                          Section-wise Breakdown
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Semester</TableHead>
                              <TableHead>Section</TableHead>
                              <TableHead>Attainment</TableHead>
                              <TableHead>Students</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.sectionWiseBreakdown.map((breakdown, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{breakdown.semester}</TableCell>
                                <TableCell>
                                  {breakdown.sectionName || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {breakdown.attainmentPercent.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      / {breakdown.threshold}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {breakdown.studentsAchieved} /{' '}
                                  {breakdown.totalStudents}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(breakdown.status)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {item.sectionWiseBreakdown.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No section-wise data available
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plo-mappings" className="space-y-4">
          {ploMappings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No CLO-PLO mappings found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  CLO-PLO mappings are managed by administrators
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ploMappings.map((item) => (
                <Card key={item.clo.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {item.clo.code}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.clo.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {item.ploMappings.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No PLO mappings for this CLO
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PLO Code</TableHead>
                            <TableHead>PLO Description</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Weight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.ploMappings.map((mapping) => (
                            <TableRow key={mapping.ploId}>
                              <TableCell className="font-medium">
                                {mapping.ploCode}
                              </TableCell>
                              <TableCell>{mapping.ploDescription}</TableCell>
                              <TableCell>
                                {mapping.programName} ({mapping.programCode})
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {(mapping.weight * 100).toFixed(0)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
