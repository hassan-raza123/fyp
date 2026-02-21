'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const courseId = params.id as string;
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [attainments, setAttainments] = useState<CLOAttainment[]>([]);
  const [ploMappings, setPLOMappings] = useState<CLOPLOMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    setMounted(true);
  }, []);

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
      return <Badge className="bg-[var(--success-green)] text-white text-[10px]">Attained</Badge>;
    }
    return <Badge variant="destructive" className="text-[10px]">Not Attained</Badge>;
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading CLOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/faculty/courses/${courseId}`)}
          className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-primary-text">
            CLOs for {course?.name} ({course?.code})
          </h1>
          <p className="text-xs text-secondary-text mt-0.5">
            View Course Learning Outcomes and their attainment status
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border border-card-border p-1 rounded-lg">
          <TabsTrigger value="list" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">CLO List</TabsTrigger>
          <TabsTrigger value="attainments" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">CLO Attainments</TabsTrigger>
          <TabsTrigger value="plo-mappings" className="text-xs data-[state=active]:bg-[var(--hover-bg)] data-[state=active]:text-primary-text rounded-md">CLO-PLO Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Course Learning Outcomes</h2>
            </div>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-primary-text">Code</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Bloom's Level</TableHead>
                    <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-secondary-text py-8">
                        No CLOs defined for this course
                      </TableCell>
                    </TableRow>
                  ) : (
                    clos.map((clo) => (
                      <TableRow key={clo.id} className="hover:bg-[var(--hover-bg)]">
                        <TableCell className="font-medium text-xs text-primary-text">{clo.code}</TableCell>
                        <TableCell className="text-xs text-primary-text">{clo.description}</TableCell>
                        <TableCell className="text-xs text-primary-text">{clo.bloomLevel || '-'}</TableCell>
                        <TableCell className="text-xs text-primary-text">
                          <Badge variant={clo.status === 'active' ? 'default' : clo.status === 'inactive' ? 'secondary' : 'destructive'} className="text-[10px]">
                            {clo.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attainments" className="space-y-4">
          {attainments.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center">
              <Target className="w-10 h-10 mx-auto mb-3 text-muted-text" />
              <p className="text-xs text-secondary-text">No CLO attainments calculated yet</p>
              <p className="text-xs text-secondary-text mt-1">Calculate CLO attainments from the Results section</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attainments.map((item) => (
                <div key={item.clo.id} className="rounded-lg border border-card-border bg-card overflow-hidden p-4">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                        <Target className="w-4 h-4" style={{ color: primaryColor }} />
                        {item.clo.code}
                      </h3>
                      <p className="text-xs text-secondary-text mt-0.5">{item.clo.description}</p>
                    </div>
                    {item.latestAttainment && (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.latestAttainment.status)}
                          <span className="text-lg font-bold text-primary-text">
                            {item.latestAttainment.attainmentPercent.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-secondary-text mt-0.5">Threshold: {item.latestAttainment.threshold}%</p>
                      </div>
                    )}
                  </div>
                  {item.latestAttainment && (
                    <div className="mb-4 p-4 rounded-lg mt-4 border border-card-border bg-card">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-medium text-primary-text">Latest Attainment</p>
                          <p className="text-xs text-secondary-text mt-0.5">
                            {item.latestAttainment.semester}
                            {item.latestAttainment.sectionName && ` • ${item.latestAttainment.sectionName}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-text">
                            {item.latestAttainment.attainmentPercent.toFixed(1)}%
                          </p>
                          {item.averageAttainment && (
                            <p className="text-xs text-secondary-text">Avg: {item.averageAttainment.toFixed(1)}%</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.sectionWiseBreakdown.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary-text mb-3">Section-wise Breakdown</h4>
                      <div className="rounded-lg border border-card-border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs font-semibold text-primary-text">Semester</TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">Section</TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">Attainment</TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">Students</TableHead>
                              <TableHead className="text-xs font-semibold text-primary-text">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.sectionWiseBreakdown.map((breakdown, idx) => (
                              <TableRow key={idx} className="hover:bg-[var(--hover-bg)]">
                                <TableCell className="text-xs text-primary-text">{breakdown.semester}</TableCell>
                                <TableCell className="text-xs text-primary-text">{breakdown.sectionName || 'N/A'}</TableCell>
                                <TableCell className="text-xs text-primary-text">
                                  <span className="font-medium">{breakdown.attainmentPercent.toFixed(1)}%</span>
                                  <span className="text-xs text-secondary-text"> / {breakdown.threshold}%</span>
                                </TableCell>
                                <TableCell className="text-xs text-primary-text">
                                  {breakdown.studentsAchieved} / {breakdown.totalStudents}
                                </TableCell>
                                <TableCell className="text-xs text-primary-text">
                                  {getStatusBadge(breakdown.status)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {item.sectionWiseBreakdown.length === 0 && (
                      <p className="text-xs text-secondary-text text-center py-4">No section-wise data available</p>
                    )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plo-mappings" className="space-y-4">
          {ploMappings.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card py-12 text-center">
              <Target className="w-10 h-10 mx-auto mb-3 text-muted-text" />
              <p className="text-xs text-secondary-text">No CLO-PLO mappings found</p>
              <p className="text-xs text-secondary-text mt-1">CLO-PLO mappings are managed by administrators</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ploMappings.map((item) => (
                <div key={item.clo.id} className="rounded-lg border border-card-border bg-card overflow-hidden p-4">
                  <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                    <Target className="w-4 h-4" style={{ color: primaryColor }} />
                    {item.clo.code}
                  </h3>
                  <p className="text-xs text-secondary-text mt-0.5">{item.clo.description}</p>
                  {item.ploMappings.length === 0 ? (
                    <p className="text-xs text-secondary-text text-center py-4 mt-4">No PLO mappings for this CLO</p>
                  ) : (
                    <div className="mt-4 rounded-lg border border-card-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs font-semibold text-primary-text">PLO Code</TableHead>
                            <TableHead className="text-xs font-semibold text-primary-text">PLO Description</TableHead>
                            <TableHead className="text-xs font-semibold text-primary-text">Program</TableHead>
                            <TableHead className="text-xs font-semibold text-primary-text">Weight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.ploMappings.map((mapping) => (
                            <TableRow key={mapping.ploId} className="hover:bg-[var(--hover-bg)]">
                              <TableCell className="font-medium text-xs text-primary-text">{mapping.ploCode}</TableCell>
                              <TableCell className="text-xs text-primary-text">{mapping.ploDescription}</TableCell>
                              <TableCell className="text-xs text-primary-text">{mapping.programName} ({mapping.programCode})</TableCell>
                              <TableCell className="text-xs text-primary-text">
                                <Badge variant="outline" className="text-[10px]">{(mapping.weight * 100).toFixed(0)}%</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
