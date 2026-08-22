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
import { Checkbox } from '@/components/ui/checkbox';
import {
  attributesFor,
  CEP_REQUIRED_ATTRIBUTE,
  validateComplexity,
  type ComplexityKind,
} from '@/constants/complexity';

interface AssessmentItemFormProps {
  assessmentId: number;
  clos: Array<{ id: number; code?: string; description: string }>;
  llos?: Array<{ id: number; code?: string; description: string }>;
  isLabAssessment?: boolean;
  /** Rubrics available on this course offering. A CEP/CEA needs one. */
  rubrics?: Array<{ id: number; title: string }>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  initialData?: any;
}

export function AssessmentItemForm({
  assessmentId,
  clos,
  llos = [],
  isLabAssessment = false,
  rubrics = [],
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
    rubricId: initialData?.rubricId?.toString() || '',
  });

  // Complex Engineering Problem / Activity. PEC requires these on core
  // engineering courses and the FYDP, evaluated by rubric and by no other
  // means — so the rubric selector above is not optional once this is set.
  const [complexity, setComplexity] = useState<ComplexityKind | ''>(
    initialData?.complexity || ''
  );
  const [complexAttributes, setComplexAttributes] = useState<string[]>(
    Array.isArray(initialData?.complexAttributes)
      ? initialData.complexAttributes
      : []
  );
  const [complexityErrors, setComplexityErrors] = useState<string[]>([]);

  const toggleAttribute = (code: string) =>
    setComplexAttributes((current) =>
      current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code]
    );

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

    payload.rubricId = formData.rubricId ? Number(formData.rubricId) : null;

    if (complexity) {
      // Checked here as well as server-side so the course team sees the
      // problem while the form is still open, rather than as a toast after
      // the round trip.
      const errors = validateComplexity(
        complexity,
        complexAttributes,
        Boolean(formData.rubricId)
      );
      if (errors.length) {
        setComplexityErrors(errors);
        return;
      }
      payload.complexity = complexity;
      payload.complexAttributes = complexAttributes;
    }

    setComplexityErrors([]);
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

      {/* Rubric — optional for an ordinary question, mandatory for a CEP/CEA */}
      <div className="space-y-2">
        <Label htmlFor="rubricId">Rubric</Label>
        <Select
          value={formData.rubricId}
          onValueChange={(value) =>
            setFormData({ ...formData, rubricId: value === 'none' ? '' : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="No rubric — scored as a single mark" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No rubric</SelectItem>
            {rubrics.map((r) => (
              <SelectItem key={r.id} value={r.id.toString()}>
                {r.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Complex Engineering Problem / Activity ───────────────────────── */}
      <div className="rounded-lg border border-subtle p-4 space-y-3">
        <div>
          <Label htmlFor="complexity">Complex Engineering Problem / Activity</Label>
          <p className="text-xs text-ink-muted mt-1">
            PEC requires core engineering courses and the FYDP to include CEPs,
            evaluated by a pre-defined rubric and by no other means.
          </p>
        </div>

        <Select
          value={complexity || 'none'}
          onValueChange={(value) => {
            setComplexity(value === 'none' ? '' : (value as ComplexityKind));
            setComplexAttributes([]);
            setComplexityErrors([]);
          }}
        >
          <SelectTrigger id="complexity">
            <SelectValue placeholder="Not a complex problem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not a complex problem</SelectItem>
            <SelectItem value="cep">Complex Engineering Problem (CEP)</SelectItem>
            <SelectItem value="cea">Complex Engineering Activity (CEA)</SelectItem>
          </SelectContent>
        </Select>

        {complexity && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Attributes exercised
              {complexity === 'cep' && (
                <span className="ml-2 normal-case font-normal tracking-normal text-ink-muted">
                  ({CEP_REQUIRED_ATTRIBUTE} is required)
                </span>
              )}
            </p>
            <div className="grid gap-2">
              {attributesFor(complexity).map((attr) => (
                <label
                  key={attr.code}
                  className="flex items-start gap-2.5 cursor-pointer rounded-md p-2 hover:bg-surface-2"
                >
                  <Checkbox
                    checked={complexAttributes.includes(attr.code)}
                    onCheckedChange={() => toggleAttribute(attr.code)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-snug">
                    <span className="font-semibold">{attr.code}</span>
                    {' — '}
                    <span className="font-medium">{attr.label}</span>
                    <span className="block text-xs text-ink-muted mt-0.5">
                      {attr.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {complexityErrors.length > 0 && (
          <ul className="space-y-1 rounded-md bg-bad-wash p-3">
            {complexityErrors.map((e) => (
              <li key={e} className="text-xs text-bad">
                {e}
              </li>
            ))}
          </ul>
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
