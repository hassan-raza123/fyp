'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
  };
}

interface LLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
}

interface LLOAttainment {
  id: number;
  lloId: number;
  courseOfferingId: number;
  totalStudents: number;
  studentsAchieved: number;
  threshold: number;
  attainmentPercent: number;
  calculatedAt: string;
  status: string;
  llo: LLO;
  courseOffering: CourseOffering;
}

export default function LLOAttainmentsPage() {
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<string>('');
  const [llos, setLLOs] = useState<LLO[]>([]);
  const [attainments, setAttainments] = useState<LLOAttainment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);
  const [threshold, setThreshold] = useState('60');

  useEffect(() => {
    fetchCourseOfferings();
  }, []);

  useEffect(() => {
    if (selectedCourseOffering) {
      fetchLLOs();
      fetchAttainments();
    }
  }, [selectedCourseOffering]);

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch('/api/course-offerings?status=active', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course offerings');
      const result = await response.json();
      if (result.success) {
        setCourseOfferings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
      toast.error('Failed to load course offerings');
    }
  };

  const fetchLLOs = async () => {
    if (!selectedCourseOffering) return;

    try {
      const offering = courseOfferings.find(
        (co) => co.id.toString() === selectedCourseOffering
      );
      if (!offering) return;

      const response = await fetch(`/api/llos?courseId=${offering.course.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch LLOs');
      const result = await response.json();
      if (result.success) {
        setLLOs(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching LLOs:', error);
      toast.error('Failed to load LLOs');
    }
  };

  const fetchAttainments = async () => {
    if (!selectedCourseOffering) return;

    try {
      const response = await fetch(
        `/api/admin/llo-attainments?courseOfferingId=${selectedCourseOffering}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch attainments');
      const result = await response.json();
      if (result.success) {
        setAttainments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching attainments:', error);
      toast.error('Failed to load attainments');
    }
  };

  const handleCalculate = async () => {
    if (!selectedCourseOffering) {
      toast.error('Please select a course offering');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/llo-attainments/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseOfferingId: parseInt(selectedCourseOffering),
          threshold: parseFloat(threshold),
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate attainments');
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'LLO attainments calculated successfully');
        setIsCalculateDialogOpen(false);
        fetchAttainments();
      } else {
        throw new Error(result.error || 'Failed to calculate attainments');
      }
    } catch (error) {
      console.error('Error calculating attainments:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to calculate attainments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (attainment: LLOAttainment) => {
    if (attainment.attainmentPercent >= attainment.threshold) {
      return (
        <Badge variant="default" className="bg-green-500">
          Attained
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          Not Attained
        </Badge>
      );
    }
  };

  const getTrendIcon = (attainment: LLOAttainment) => {
    if (attainment.attainmentPercent >= attainment.threshold) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const selectedOffering = courseOfferings.find(
    (co) => co.id.toString() === selectedCourseOffering
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LLO Attainments</h1>
          <p className="text-muted-foreground">
            Calculate and analyze Lab Learning Outcome achievement percentages
          </p>
        </div>
        {selectedCourseOffering && (
          <Button onClick={() => setIsCalculateDialogOpen(true)}>
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Attainments
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Course Offering</CardTitle>
          <CardDescription>
            Choose a course offering to view LLO attainments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Course Offering *</Label>
            <Select
              value={selectedCourseOffering}
              onValueChange={setSelectedCourseOffering}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course offering" />
              </SelectTrigger>
              <SelectContent>
                {courseOfferings.map((offering) => (
                  <SelectItem key={offering.id} value={offering.id.toString()}>
                    {offering.course.code} - {offering.course.name} (
                    {offering.semester.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedCourseOffering && (
        <>
          {llos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No LLOs found for this course. Please create LLOs first.
              </CardContent>
            </Card>
          ) : attainments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No LLO attainments calculated yet for this course offering.
                </p>
                <Button onClick={() => setIsCalculateDialogOpen(true)}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Attainments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total LLOs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{llos.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Attained LLOs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {attainments.filter(
                        (a) => a.attainmentPercent >= a.threshold
                      ).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Attainment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {attainments.length > 0
                        ? (
                            attainments.reduce(
                              (sum, a) => sum + a.attainmentPercent,
                              0
                            ) / attainments.length
                          ).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Attainment Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {llos.length > 0
                        ? (
                            (attainments.filter(
                              (a) => a.attainmentPercent >= a.threshold
                            ).length /
                              llos.length) *
                            100
                          ).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>LLO Attainment Details</CardTitle>
                  <CardDescription>
                    {selectedOffering?.course.code} - {selectedOffering?.course.name} (
                    {selectedOffering?.semester.name})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>LLO Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Total Students</TableHead>
                          <TableHead>Students Achieved</TableHead>
                          <TableHead>Attainment %</TableHead>
                          <TableHead>Threshold</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Calculated At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attainments.map((attainment) => (
                          <TableRow key={attainment.id}>
                            <TableCell className="font-medium">
                              {attainment.llo.code}
                            </TableCell>
                            <TableCell className="max-w-md truncate">
                              {attainment.llo.description}
                            </TableCell>
                            <TableCell>{attainment.totalStudents}</TableCell>
                            <TableCell>{attainment.studentsAchieved}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTrendIcon(attainment)}
                                <span className="font-medium">
                                  {attainment.attainmentPercent.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{attainment.threshold}%</TableCell>
                            <TableCell>{getStatusBadge(attainment)}</TableCell>
                            <TableCell>
                              {new Date(attainment.calculatedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Calculate Dialog */}
      <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculate LLO Attainments</DialogTitle>
            <DialogDescription>
              Calculate LLO attainments for the selected course offering
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course Offering</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedOffering?.course.code} - {selectedOffering?.course.name} (
                {selectedOffering?.semester.name})
              </p>
            </div>
            <div>
              <Label htmlFor="threshold">Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum percentage required for LLO attainment (default: 60%)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCalculateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCalculate} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

