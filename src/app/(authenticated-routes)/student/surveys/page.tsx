'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: number;
  question: string;
  questionType: 'rating' | 'text';
  plo: { id: number; code: string } | null;
  orderIndex: number;
}

interface Survey {
  id: number;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'closed';
  dueDate: string | null;
  courseOffering: {
    course: { code: string; name: string };
    semester: { name: string };
  };
  _count: { questions: number; responses: number };
}

interface AnswerDraft {
  [questionId: number]: { ratingValue?: number; textValue?: string };
}

const RATING_LABELS: Record<number, string> = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree',
};

export default function StudentSurveysPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252,153,40,0.15)' : 'rgba(38,40,149,0.15)';

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  // Track which surveys the student has already responded to
  const [respondedIds, setRespondedIds] = useState<Set<number>>(new Set());

  // Fill survey dialog
  const [fillOpen, setFillOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerDraft>({});
  const [submitting, setSubmitting] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/surveys', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list: Survey[] = data.data ?? [];
        setSurveys(list);

        // Check which ones the student has already responded to
        const checks = await Promise.all(
          list.map(async (s) => {
            const r = await fetch(`/api/surveys/${s.id}/respond`, { credentials: 'include' });
            const d = await r.json();
            return { id: s.id, responded: d.data?.hasResponded ?? false };
          })
        );
        setRespondedIds(new Set(checks.filter((c) => c.responded).map((c) => c.id)));
      } catch {
        toast.error('Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const openSurvey = async (survey: Survey) => {
    setActiveSurvey(survey);
    setAnswers({});
    setFillOpen(true);
    setQuestionsLoading(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, { credentials: 'include' });
      const data = await res.json();
      setQuestions(data.data?.questions ?? []);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeSurvey) return;

    // Validate all questions answered
    const unanswered = questions.filter((q) => {
      const a = answers[q.id];
      if (!a) return true;
      if (q.questionType === 'rating') return a.ratingValue === undefined;
      if (q.questionType === 'text') return !a.textValue?.trim();
      return false;
    });

    if (unanswered.length > 0) {
      toast.error(`Please answer all ${unanswered.length} question(s)`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        ratingValue: answers[q.id]?.ratingValue,
        textValue: answers[q.id]?.textValue,
      }));

      const res = await fetch(`/api/surveys/${activeSurvey.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      toast.success(data.message);
      setRespondedIds((prev) => new Set([...prev, activeSurvey.id]));
      setFillOpen(false);
    } catch {
      toast.error('Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBgColor }}>
          <ClipboardList className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Surveys</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Provide feedback on your courses to help improve the program
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-card-border bg-card p-8 flex justify-center">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }} />
        </div>
      ) : surveys.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center text-xs text-secondary-text">
          No active surveys for your courses at the moment.
        </div>
      ) : (
        <div className="space-y-2">
          {surveys.map((survey) => {
            const responded = respondedIds.has(survey.id);
            return (
              <div key={survey.id} className="rounded-lg border border-card-border bg-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-primary-text truncate">{survey.title}</p>
                    {responded && (
                      <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Submitted
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-secondary-text mt-0.5">
                    {survey.courseOffering.course.code} — {survey.courseOffering.course.name} · {survey.courseOffering.semester.name}
                  </p>
                  <p className="text-[11px] text-secondary-text mt-0.5">
                    {survey._count.questions} question{survey._count.questions !== 1 ? 's' : ''}
                    {survey.dueDate && ` · Due: ${new Date(survey.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                {responded ? (
                  <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Done</span>
                  </div>
                ) : (
                  <Button size="sm" className="h-8 text-xs text-white flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => openSurvey(survey)}>
                    <Clock className="h-3.5 w-3.5 mr-1" /> Fill Survey
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FILL SURVEY DIALOG ── */}
      <Dialog open={fillOpen} onOpenChange={setFillOpen}>
        <DialogContent className="max-w-xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">
              {activeSurvey?.title}
            </DialogTitle>
            {activeSurvey?.description && (
              <p className="text-xs text-secondary-text mt-1">{activeSurvey.description}</p>
            )}
          </DialogHeader>

          {questionsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }} />
            </div>
          ) : (
            <div className="space-y-5 mt-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-xs font-medium text-primary-text">
                    {idx + 1}. {q.question}
                    {q.plo && <span className="ml-1.5 text-[10px] text-secondary-text">({q.plo.code})</span>}
                  </p>

                  {q.questionType === 'rating' ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], ratingValue: v } }))}
                          title={RATING_LABELS[v]}
                          className={`h-9 w-9 rounded-lg text-sm font-semibold border transition-all ${
                            answers[q.id]?.ratingValue === v
                              ? 'text-white border-transparent'
                              : 'text-primary-text border-card-border bg-card hover:bg-hover-bg'
                          }`}
                          style={answers[q.id]?.ratingValue === v ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                        >
                          {v}
                        </button>
                      ))}
                      {answers[q.id]?.ratingValue && (
                        <span className="self-center text-[11px] text-secondary-text ml-1">
                          {RATING_LABELS[answers[q.id].ratingValue!]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[q.id]?.textValue ?? ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], textValue: e.target.value } }))}
                      placeholder="Your response..."
                      rows={3}
                      className="text-xs bg-card border-card-border text-primary-text resize-none"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2 border-t border-card-border">
                <Button size="sm" variant="outline" onClick={() => setFillOpen(false)} className="h-8 text-xs border-card-border text-primary-text">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={submitting} className="h-8 text-xs text-white"
                  style={{ backgroundColor: primaryColor }}>
                  {submitting ? 'Submitting...' : 'Submit Survey'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
