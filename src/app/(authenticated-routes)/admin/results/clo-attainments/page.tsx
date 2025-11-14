'use client';

import React, { useState, useEffect } from 'react';
import { CLOAttainments } from '@/components/assessments/CLOAttainments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Section {
  id: number;
  name: string;
  courseOffering: {
    course: {
      id: number;
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
}

const CLOAttainmentsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections on component mount
  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/sections?status=active');
        if (!response.ok) throw new Error('Failed to fetch sections');
        const data = await response.json();
        if (data.success) {
          setSections(data.data);
        } else {
          setSections(data);
        }
      } catch (err) {
        setError('Failed to load sections');
        console.error(err);
        toast.error('Failed to load sections');
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const selectedSectionData = sections.find(
    (section) => section.id.toString() === selectedSection
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">CLO Attainments</h1>
        <p className="text-muted-foreground">
          Calculate and analyze Course Learning Outcome achievement percentages
        </p>
      </div>

      <Card className="p-6 mb-6">
        <CardHeader>
          <CardTitle>Select Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
              disabled={loading}
            >
              <SelectTrigger id="section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id.toString()}>
                    {section.courseOffering.course.code} - {section.name} (
                    {section.courseOffering.semester.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sections.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No active sections found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-6">
          <div className="text-center py-4">Loading sections...</div>
        </Card>
      ) : selectedSection && selectedSectionData ? (
        <CLOAttainments
          sectionId={parseInt(selectedSection)}
          courseId={selectedSectionData.courseOffering.course.id}
        />
      ) : (
        <Card className="p-6">
          <div className="text-center text-muted-foreground py-4">
            {!selectedSection
              ? 'Please select a section to view CLO attainments'
              : 'No section data available'}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CLOAttainmentsPage;
