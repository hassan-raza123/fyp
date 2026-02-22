import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssessmentItemFormProps {
  assessmentId: number;
  clos: Array<{ id: number; code?: string; description: string }>;
  llos?: Array<{ id: number; code?: string; description: string }>;
  isLabAssessment?: boolean;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  initialData?: any;
}

export function AssessmentItemForm({
  assessmentId,
  clos,
  llos = [],
  isLabAssessment = false,
  onSubmit,
  isLoading = false,
  initialData,
}: AssessmentItemFormProps) {
  const [formData, setFormData] = useState({
    questionNo: initialData?.questionNo || '',
    description: initialData?.description || '',
    marks: initialData?.marks || 0,
    cloId: initialData?.cloId?.toString() || '',
    lloId: initialData?.lloId?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      assessmentId,
      questionNo: formData.questionNo,
      description: formData.description,
      marks: Number(formData.marks),
    };

    if (isLabAssessment) {
      payload.lloId = formData.lloId ? Number(formData.lloId) : null;
    } else {
      payload.cloId = formData.cloId ? Number(formData.cloId) : null;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionNo">Question Number</Label>
        <Input
          id="questionNo"
          value={formData.questionNo}
          onChange={(e) =>
            setFormData({ ...formData, questionNo: e.target.value })
          }
          placeholder="e.g., Q1, Q1a, Q1b"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Question Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter question description"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marks">Marks</Label>
          <Input
            id="marks"
            type="number"
            value={formData.marks}
            onChange={(e) =>
              setFormData({ ...formData, marks: Number(e.target.value) })
            }
            required
          />
        </div>

        {isLabAssessment ? (
          <div className="space-y-2 col-span-2">
            <Label htmlFor="lloId">
              Lab Learning Outcome (LLO)
              <span className="ml-1 text-xs text-secondary-text">(Lab assessment)</span>
            </Label>
            <Select
              value={formData.lloId}
              onValueChange={(value) =>
                setFormData({ ...formData, lloId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select LLO" />
              </SelectTrigger>
              <SelectContent>
                {llos.map((llo) => (
                  <SelectItem key={llo.id} value={llo.id.toString()}>
                    {llo.code ? `${llo.code}: ` : ''}
                    {llo.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2 col-span-2">
            <Label htmlFor="cloId">
              Course Learning Outcome (CLO)
            </Label>
            <Select
              value={formData.cloId}
              onValueChange={(value) =>
                setFormData({ ...formData, cloId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select CLO" />
              </SelectTrigger>
              <SelectContent>
                {clos.map((clo) => (
                  <SelectItem key={clo.id} value={clo.id.toString()}>
                    {clo.code ? `${clo.code}: ` : ''}
                    {clo.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? initialData
            ? 'Updating Question...'
            : 'Adding Question...'
          : initialData
          ? 'Update Question'
          : 'Add Question'}
      </Button>
    </form>
  );
}
