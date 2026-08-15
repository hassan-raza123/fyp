'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';

/**
 * Rubric management.
 *
 * The rubric feature existed everywhere except here: three database models, a
 * full CRUD API, `scoreFromRubric()` in `lib/obe.ts`, and end-to-end tests —
 * but no screen, so a rubric could only ever be created by calling the API
 * directly. This is that screen.
 *
 * A rubric belongs to a course offering and to exactly one outcome (a CLO or an
 * LLO). Its criteria carry weights, and `scoreFromRubric` turns the levels a
 * marker selects into the item's mark — which is what makes a rubric more than
 * documentation: the mark is *derived* from the criteria rather than typed in
 * beside them, so the two cannot disagree.
 */

const LEVELS = ['excellent', 'good', 'satisfactory', 'unsatisfactory'] as const;

/** Mirrors RUBRIC_LEVEL_FRACTIONS in lib/obe.ts — shown so the marker can see
 *  what each level is worth before choosing it. */
const LEVEL_SHARE: Record<(typeof LEVELS)[number], string> = {
  excellent: '100%',
  good: '75%',
  satisfactory: '50%',
  unsatisfactory: '25%',
};

interface Criterion {
  id?: number;
  description: string;
  excellent: string;
  good: string;
  satisfactory: string;
  unsatisfactory: string;
  weight: number;
}

interface Rubric {
  id: number;
  title: string;
  courseOfferingId: number;
  cloId: number | null;
  lloId: number | null;
  clo?: { id: number; code: string; description: string } | null;
  llo?: { id: number; code: string; description: string } | null;
  criteria: Criterion[];
}

interface Offering {
  id: number;
  course: { id: number; code: string; name: string };
  semester: { id: number; name: string };
}

interface Outcome {
  id: number;
  code: string;
  description: string;
}

function emptyCriterion(): Criterion {
  return {
    description: '',
    excellent: '',
    good: '',
    satisfactory: '',
    unsatisfactory: '',
    weight: 1,
  };
}

export function RubricManager({ title }: { title: string }) {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [offeringId, setOfferingId] = useState<string>('');
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [clos, setClos] = useState<Outcome[]>([]);
  const [llos, setLlos] = useState<Outcome[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [editing, setEditing] = useState<Rubric | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Rubric | null>(null);

  const [form, setForm] = useState({
    title: '',
    outcome: '',
    criteria: [emptyCriterion()] as Criterion[],
  });

  // Course offerings the caller may work with. The endpoint answers per role:
  // a faculty member gets the offerings they teach, an admin their department's.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/faculty/course-offerings', {
          credentials: 'include',
        });
        const body = await response.json();
        if (cancelled) return;

        const list: Offering[] = body?.data ?? [];
        setOfferings(list);
        if (list.length > 0) setOfferingId(String(list[0].id));
      } catch {
        if (!cancelled) toast.error('Could not load course offerings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Rubrics and the outcomes they can be attached to, for the chosen offering.
  useEffect(() => {
    if (!offeringId) return;
    let cancelled = false;

    (async () => {
      const offering = offerings.find((o) => String(o.id) === offeringId);

      try {
        const [rubricRes, cloRes, lloRes] = await Promise.all([
          fetch(`/api/rubrics?courseOfferingId=${offeringId}`, {
            credentials: 'include',
          }),
          offering
            ? fetch(`/api/courses/${offering.course.id}/clos`, {
                credentials: 'include',
              })
            : Promise.resolve(null),
          offering
            ? fetch(`/api/courses/${offering.course.id}/llos`, {
                credentials: 'include',
              })
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const rubricBody = await rubricRes.json();
        setRubrics(rubricBody?.data ?? rubricBody ?? []);

        if (cloRes) {
          const b = await cloRes.json();
          setClos(b?.data ?? []);
        }
        if (lloRes) {
          const b = await lloRes.json();
          setLlos(b?.data ?? []);
        }
      } catch {
        if (!cancelled) toast.error('Could not load rubrics');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [offeringId, offerings, reloadToken]);

  const reload = () => setReloadToken((n) => n + 1);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', outcome: '', criteria: [emptyCriterion()] });
    setDialogOpen(true);
  };

  const openEdit = (rubric: Rubric) => {
    setEditing(rubric);
    setForm({
      title: rubric.title,
      outcome: rubric.cloId ? `clo:${rubric.cloId}` : `llo:${rubric.lloId}`,
      criteria:
        rubric.criteria.length > 0 ? rubric.criteria : [emptyCriterion()],
    });
    setDialogOpen(true);
  };

  const updateCriterion = (index: number, patch: Partial<Criterion>) => {
    setForm((f) => ({
      ...f,
      criteria: f.criteria.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  };

  const totalWeight = form.criteria.reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0
  );

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Give the rubric a title');
      return;
    }
    if (!form.outcome) {
      toast.error('A rubric must be attached to a CLO or an LLO');
      return;
    }
    if (form.criteria.some((c) => !c.description.trim())) {
      toast.error('Every criterion needs a description');
      return;
    }
    if (totalWeight <= 0) {
      toast.error('The criteria weights must add up to more than zero');
      return;
    }

    const [kind, id] = form.outcome.split(':');

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        courseOfferingId: Number(offeringId),
        cloId: kind === 'clo' ? Number(id) : null,
        lloId: kind === 'llo' ? Number(id) : null,
        criteria: form.criteria.map((c) => ({
          description: c.description.trim(),
          excellent: c.excellent.trim(),
          good: c.good.trim(),
          satisfactory: c.satisfactory.trim(),
          unsatisfactory: c.unsatisfactory.trim(),
          weight: Number(c.weight) || 1,
        })),
      };

      const response = await fetch(
        editing ? `/api/rubrics/${editing.id}` : '/api/rubrics',
        {
          method: editing ? 'PUT' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || 'Could not save the rubric');
      }

      toast.success(editing ? 'Rubric updated' : 'Rubric created');
      setDialogOpen(false);
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save the rubric'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/rubrics/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || 'Could not delete the rubric');
      }
      toast.success('Rubric deleted');
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not delete the rubric'
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className='space-y-6 p-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-sm text-muted-foreground'>
            Marking guides whose criteria derive the mark, rather than sitting
            beside it.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!offeringId}>
          <Plus className='mr-2 h-4 w-4' aria-hidden='true' />
          New rubric
        </Button>
      </div>

      {offerings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No course offerings</CardTitle>
            <CardDescription>
              A rubric belongs to a course offering. Once one exists you can
              build rubrics against it.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className='max-w-md space-y-2'>
            <Label htmlFor='offering'>Course offering</Label>
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger id='offering'>
                <SelectValue placeholder='Choose a course offering' />
              </SelectTrigger>
              <SelectContent>
                {offerings.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.course.code} — {o.course.name} ({o.semester.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rubrics.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No rubrics yet</CardTitle>
                <CardDescription>
                  Create one to mark an assessment item against explicit
                  criteria instead of a single number.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {rubrics.map((rubric) => {
                const weight = rubric.criteria.reduce(
                  (sum, c) => sum + (c.weight || 0),
                  0
                );
                const outcome = rubric.clo ?? rubric.llo;

                return (
                  <Card key={rubric.id}>
                    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
                      <div>
                        <CardTitle className='text-base'>
                          {rubric.title}
                        </CardTitle>
                        <CardDescription>
                          {outcome
                            ? `${outcome.code} · ${outcome.description}`
                            : 'Not attached to an outcome'}
                        </CardDescription>
                      </div>
                      <div className='flex shrink-0 items-center gap-2'>
                        <Badge variant='outline'>
                          {rubric.criteria.length} criteria
                        </Badge>
                        <Button
                          size='sm'
                          variant='outline'
                          aria-label={`Edit ${rubric.title}`}
                          onClick={() => openEdit(rubric)}
                        >
                          <Pencil className='h-3.5 w-3.5' aria-hidden='true' />
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          aria-label={`Delete ${rubric.title}`}
                          onClick={() => setDeleteTarget(rubric)}
                        >
                          <Trash2 className='h-3.5 w-3.5' aria-hidden='true' />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className='space-y-2'>
                        {rubric.criteria.map((c, i) => (
                          <li
                            key={c.id ?? i}
                            className='flex items-start justify-between gap-4 text-sm'
                          >
                            <span>{c.description}</span>
                            <span className='shrink-0 text-xs text-muted-foreground'>
                              {weight > 0
                                ? `${Math.round((c.weight / weight) * 100)}% of the mark`
                                : `weight ${c.weight}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[85vh] max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit rubric' : 'New rubric'}</DialogTitle>
            <DialogDescription>
              Each criterion contributes a share of the item&apos;s marks in
              proportion to its weight, scaled by the level awarded.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='rubric-title'>Title</Label>
              <Input
                id='rubric-title'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='e.g. Lab report marking guide'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='rubric-outcome'>Outcome</Label>
              <Select
                value={form.outcome}
                onValueChange={(v) => setForm({ ...form, outcome: v })}
              >
                <SelectTrigger id='rubric-outcome'>
                  <SelectValue placeholder='Attach to a CLO or LLO' />
                </SelectTrigger>
                <SelectContent>
                  {clos.map((c) => (
                    <SelectItem key={`clo-${c.id}`} value={`clo:${c.id}`}>
                      CLO {c.code} — {c.description}
                    </SelectItem>
                  ))}
                  {llos.map((l) => (
                    <SelectItem key={`llo-${l.id}`} value={`llo:${l.id}`}>
                      LLO {l.code} — {l.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label>Criteria</Label>
                <span className='text-xs text-muted-foreground'>
                  total weight {totalWeight}
                </span>
              </div>

              {form.criteria.map((c, index) => (
                <Card key={index}>
                  <CardContent className='space-y-3 pt-6'>
                    <div className='flex items-end gap-3'>
                      <div className='flex-1 space-y-2'>
                        <Label htmlFor={`c-desc-${index}`}>Criterion</Label>
                        <Input
                          id={`c-desc-${index}`}
                          value={c.description}
                          onChange={(e) =>
                            updateCriterion(index, {
                              description: e.target.value,
                            })
                          }
                          placeholder='e.g. Correctness of the implementation'
                        />
                      </div>
                      <div className='w-28 space-y-2'>
                        <Label htmlFor={`c-weight-${index}`}>Weight</Label>
                        <Input
                          id={`c-weight-${index}`}
                          type='number'
                          min={0}
                          step='0.1'
                          value={c.weight}
                          onChange={(e) =>
                            updateCriterion(index, {
                              weight: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      {form.criteria.length > 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          aria-label={`Remove criterion ${index + 1}`}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              criteria: f.criteria.filter(
                                (_, i) => i !== index
                              ),
                            }))
                          }
                        >
                          <Trash2 className='h-3.5 w-3.5' aria-hidden='true' />
                        </Button>
                      )}
                    </div>

                    <div className='grid gap-3 sm:grid-cols-2'>
                      {LEVELS.map((level) => (
                        <div key={level} className='space-y-1.5'>
                          <Label
                            htmlFor={`c-${level}-${index}`}
                            className='capitalize'
                          >
                            {level}{' '}
                            <span className='text-xs font-normal text-muted-foreground'>
                              ({LEVEL_SHARE[level]})
                            </span>
                          </Label>
                          <Textarea
                            id={`c-${level}-${index}`}
                            rows={2}
                            value={c[level]}
                            onChange={(e) =>
                              updateCriterion(index, {
                                [level]: e.target.value,
                              } as Partial<Criterion>)
                            }
                            placeholder={`What ${level} work looks like`}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    criteria: [...f.criteria, emptyCriterion()],
                  }))
                }
              >
                <Plus className='mr-2 h-4 w-4' aria-hidden='true' />
                Add criterion
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create rubric'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rubric?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; and its criteria will be
              removed. Items already marked with it keep their marks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
