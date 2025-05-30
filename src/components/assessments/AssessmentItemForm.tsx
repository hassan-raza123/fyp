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
  clos: Array<{ id: number; description: string }>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function AssessmentItemForm({
  assessmentId,
  clos,
  onSubmit,
  isLoading = false,
}: AssessmentItemFormProps) {
  const [formData, setFormData] = useState({
    questionNo: '',
    description: '',
    marks: 0,
    cloId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      assessmentId,
      marks: Number(formData.marks),
      cloId: Number(formData.cloId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='questionNo'>Question Number</Label>
        <Input
          id='questionNo'
          value={formData.questionNo}
          onChange={(e) =>
            setFormData({ ...formData, questionNo: e.target.value })
          }
          placeholder='e.g., Q1, Q1a, Q1b'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Question Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder='Enter question description'
          required
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='marks'>Marks</Label>
          <Input
            id='marks'
            type='number'
            value={formData.marks}
            onChange={(e) =>
              setFormData({ ...formData, marks: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className='space-y-2 col-span-2'>
          <Label htmlFor='cloId'>CLO</Label>
          <Select
            value={formData.cloId}
            onValueChange={(value) =>
              setFormData({ ...formData, cloId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='Select CLO' />
            </SelectTrigger>
            <SelectContent>
              {clos.map((clo) => (
                <SelectItem key={clo.id} value={clo.id.toString()}>
                  {clo.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading ? 'Adding Question...' : 'Add Question'}
      </Button>
    </form>
  );
}
