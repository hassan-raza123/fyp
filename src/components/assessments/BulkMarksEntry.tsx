import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Student {
  id: number;
  rollNumber: string;
  user: {
    name: string;
  };
}

interface AssessmentItem {
  id: number;
  questionNo: string;
  marks: number;
}

interface Assessment {
  id: number;
  title: string;
  type: string;
  assessmentItems: AssessmentItem[];
}

interface BulkMarksEntryProps {
  sectionId: number;
  assessmentId: number;
  students: Student[];
  assessment: Assessment;
  onSuccess?: () => void;
}

export const BulkMarksEntry: React.FC<BulkMarksEntryProps> = ({
  sectionId,
  assessmentId,
  students,
  assessment,
  onSuccess,
}) => {
  const [marks, setMarks] = useState<Record<number, Record<number, number>>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // Initialize marks object
  useEffect(() => {
    const initialMarks: Record<number, Record<number, number>> = {};
    students.forEach((student) => {
      initialMarks[student.id] = {};
      assessment.assessmentItems.forEach((item) => {
        initialMarks[student.id][item.id] = 0;
      });
    });
    setMarks(initialMarks);
  }, [students, assessment]);

  const handleMarkChange = (
    studentId: number,
    itemId: number,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const maxMarks = assessment.assessmentItems.find(
      (item) => item.id === itemId
    )?.marks;
    if (maxMarks && numValue > maxMarks) {
      toast.error(`Marks cannot exceed ${maxMarks}`);
      return;
    }

    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [itemId]: numValue,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Prepare data for API
      const marksData = students.map((student) => ({
        studentId: student.id,
        items: assessment.assessmentItems.map((item) => ({
          itemId: item.id,
          marks: marks[student.id][item.id] || 0,
        })),
      }));

      const response = await fetch('/api/assessment-results/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId,
          assessmentId,
          marks: marksData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save marks');
      }

      toast.success('Marks saved successfully');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save marks'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border'>
          <thead>
            <tr>
              <th className='border p-2'>Roll No</th>
              <th className='border p-2'>Student Name</th>
              {assessment.assessmentItems.map((item) => (
                <th key={item.id} className='border p-2'>
                  Q{item.questionNo}
                  <br />
                  <span className='text-sm text-gray-500'>
                    (Max: {item.marks})
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className='border p-2'>{student.rollNumber}</td>
                <td className='border p-2'>{student.user.name}</td>
                {assessment.assessmentItems.map((item) => (
                  <td key={item.id} className='border p-2'>
                    <Input
                      type='number'
                      min='0'
                      max={item.marks}
                      step='0.5'
                      value={marks[student.id]?.[item.id] || ''}
                      onChange={(e) =>
                        handleMarkChange(student.id, item.id, e.target.value)
                      }
                      className='w-20'
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex justify-end'>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {loading ? 'Saving...' : 'Save Marks'}
        </Button>
      </div>
    </div>
  );
};
