'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Score an assessment item against its rubric.
 *
 * The mark is derived from the selected levels by the server, not typed in
 * separately, so the recorded breakdown and the awarded mark cannot disagree.
 */

const LEVELS = [
  { key: 'excellent', label: 'Excellent', share: '100%' },
  { key: 'good', label: 'Good', share: '75%' },
  { key: 'satisfactory', label: 'Satisfactory', share: '50%' },
  { key: 'unsatisfactory', label: 'Unsatisfactory', share: '25%' },
] as const;

type LevelKey = (typeof LEVELS)[number]['key'];

interface RubricCriterion {
  id: number;
  description: string;
  weight: number;
  excellent: string;
  good: string;
  satisfactory: string;
  unsatisfactory: string;
}

interface RubricScoringProps {
  /** studentassessmentresults id */
  resultId: number;
  assessmentItemId: number;
  itemMarks: number;
  rubricId: number;
  studentName?: string;
  onScored?: (obtainedMarks: number) => void;
}

export function RubricScoring({
  resultId,
  assessmentItemId,
  itemMarks,
  rubricId,
  studentName,
  onScored,
}: RubricScoringProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [levels, setLevels] = useState<Record<number, LevelKey>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/rubrics/${rubricId}`, {
          credentials: 'include',
        });
        const payload = await res.json();
        // The rubric endpoint returns the record directly; tolerate a wrapped
        // shape too so this keeps working if that endpoint is normalised later.
        setCriteria(payload?.criteria ?? payload?.data?.criteria ?? []);
      } catch {
        toast.error('Failed to load rubric');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [rubricId]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  // Mirrors the server's calculation so the figure updates as levels are picked
  const previewMarks = criteria.reduce((sum, criterion) => {
    const level = levels[criterion.id];
    if (!level || totalWeight <= 0) return sum;
    const share = (criterion.weight / totalWeight) * itemMarks;
    const fraction = { excellent: 1, good: 0.75, satisfactory: 0.5, unsatisfactory: 0.25 }[level];
    return sum + share * fraction;
  }, 0);

  const allScored = criteria.length > 0 && criteria.every((c) => levels[c.id]);

  const handleSubmit = async () => {
    if (!allScored) {
      toast.error('Select a level for every criterion');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/assessment-results/${resultId}/rubric-score`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            assessmentItemId,
            scores: criteria.map((c) => ({
              criterionId: c.id,
              level: levels[c.id],
              comment: comments[c.id] || undefined,
            })),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Failed to save rubric score');
        return;
      }

      toast.success(
        `Scored ${data.data.itemMarks} / ${itemMarks}${studentName ? ` for ${studentName}` : ''}`
      );
      onScored?.(data.data.itemMarks);
    } catch {
      toast.error('Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading rubric...
      </div>
    );
  }

  if (criteria.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        This rubric has no criteria defined yet.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" />
              Rubric scoring
            </CardTitle>
            <CardDescription>
              {studentName ? `${studentName} — ` : ''}
              item worth {itemMarks} marks
            </CardDescription>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Calculated mark</p>
            <p className="text-xl font-bold">
              {previewMarks.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {itemMarks}
              </span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {criteria.map((criterion) => {
          const share =
            totalWeight > 0
              ? ((criterion.weight / totalWeight) * itemMarks).toFixed(2)
              : '0';

          return (
            <div key={criterion.id} className="space-y-3 border-b pb-5 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{criterion.description}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {share} marks
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {LEVELS.map((level) => {
                  const selected = levels[criterion.id] === level.key;
                  return (
                    <button
                      key={level.key}
                      type="button"
                      onClick={() =>
                        setLevels((prev) => ({ ...prev, [criterion.id]: level.key }))
                      }
                      className={`rounded-md border p-2 text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{level.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {level.share}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        {criterion[level.key]}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor={`comment-${criterion.id}`}
                  className="text-[11px] text-muted-foreground"
                >
                  Comment (optional)
                </Label>
                <Input
                  id={`comment-${criterion.id}`}
                  value={comments[criterion.id] ?? ''}
                  onChange={(e) =>
                    setComments((prev) => ({
                      ...prev,
                      [criterion.id]: e.target.value,
                    }))
                  }
                  placeholder="Feedback for this criterion"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {allScored
              ? 'All criteria scored.'
              : `${criteria.filter((c) => levels[c.id]).length} of ${criteria.length} criteria scored.`}
          </p>
          <Button onClick={handleSubmit} disabled={!allScored || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save score'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
