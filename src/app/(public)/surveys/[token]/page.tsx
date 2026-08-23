'use client';

import { useEffect, useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { PRODUCT_NAME } from '@/constants/branding';
import { useParams } from 'next/navigation';

interface SurveyQuestion {
  id: number;
  question: string;
  questionType: 'rating' | 'text';
  orderIndex: number;
  plo?: { id: number; code: string; description: string } | null;
}

interface SurveyData {
  id: number;
  title: string;
  description: string | null;
  type: string;
  dueDate: string | null;
  questions: SurveyQuestion[];
  /** The institution running the survey. Null until they set it in Settings. */
  institutionName: string | null;
}

interface AnswerMap {
  [questionId: number]: { ratingValue?: number; textValue?: string };
}

export default function PublicSurveyPage() {
  const params = useParams();
  const token = params.token as string;
  const formId = useId();

  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Guarded: without this an in-flight response for a previous token can
    // resolve after the current one and overwrite it.
    let cancelled = false;
    fetch(`/api/surveys/respond-public?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setSurvey(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load survey');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleRating = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ratingValue: value } }));
  };

  const handleText = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { textValue: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Validate all questions answered
    const unanswered = survey.questions.filter((q) => {
      const ans = answers[q.id];
      if (q.questionType === 'rating') return ans?.ratingValue == null;
      return !ans?.textValue?.trim();
    });

    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/surveys/respond-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          respondentName: respondentName || null,
          respondentEmail: respondentEmail || null,
          answers: Object.entries(answers).map(([qId, ans]) => ({
            questionId: Number(qId),
            ...ans,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /*
    The three states below reached an external respondent — an employer or an
    alumnus following a link they were emailed — as a bare card on a grey
    field, with no heading level, no indication of who had asked them for
    anything, and nothing to do next. Each now carries the product line and
    a real <h1>.

    The icons were the bare glyphs "⚠" and "✓", set at text-4xl/5xl. Those
    render as whatever the respondent's platform substitutes, at whatever
    size and weight it chooses, and the tick in particular is commonly
    coloured by the platform's own emoji font.
  */
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-surface-2 p-4'>
        <div className='flex items-center gap-3 text-ink-2'>
          <Loader2 className='w-5 h-5 animate-spin' aria-hidden />
          <span>Loading survey…</span>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-surface-2 p-4'>
        <div className='bg-surface rounded-2xl shadow-sm border border-subtle p-8 max-w-md w-full text-center'>
          <span className='inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-bad-wash'>
            <AlertTriangle className='w-7 h-7 text-bad' aria-hidden />
          </span>
          <h1 className='text-2xl font-extrabold tracking-tight text-ink mb-2'>
            This survey is not available
          </h1>
          <p className='text-sm text-ink-2'>{error}</p>
          <p className='text-xs text-ink-muted mt-6 pt-4 border-t border-subtle'>
            If you were sent this link, ask whoever sent it for a new one.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-surface-2 p-4'>
        <div className='bg-surface rounded-2xl shadow-sm border border-subtle p-8 max-w-md w-full text-center'>
          <span className='inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-good-wash'>
            <CheckCircle2 className='w-7 h-7 text-good' aria-hidden />
          </span>
          <h1 className='text-2xl font-extrabold tracking-tight text-ink mb-2'>
            Thank you
          </h1>
          <p className='text-sm text-ink-2'>
            Your response has been recorded. You can close this page.
          </p>
          <p className='text-xs text-ink-muted mt-6 pt-4 border-t border-subtle'>
            {survey?.institutionName
              ? `${survey.institutionName} — powered by ${PRODUCT_NAME}`
              : PRODUCT_NAME}
          </p>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const surveyTypeLabel: Record<string, string> = {
    alumni: 'Alumni Survey',
    employer: 'Employer Feedback Survey',
    program_exit: 'Program Exit Survey',
    course_exit: 'Course Exit Survey',
  };

  return (
    <div className="min-h-screen bg-surface-2 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className='bg-surface rounded-2xl shadow-sm border border-subtle p-6 mb-6'>
          <span
            className='inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3'
            style={{
              backgroundColor: 'var(--accent-wash)',
              color: 'var(--accent-active)',
            }}
          >
            {surveyTypeLabel[survey.type] ?? survey.type}
          </span>
          <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight text-ink mb-2'>
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-ink-muted text-sm">{survey.description}</p>
          )}
          {survey.dueDate && (
            <p className="text-ink-muted text-xs mt-2">
              Due: {new Date(survey.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Respondent info.

              Both labels were bare <label> elements with no `htmlFor` and no
              input nested inside them, so neither was associated with its
              field: a screen reader announced two unlabelled text boxes, and
              clicking a label did not focus anything. */}
          <div className='bg-surface rounded-2xl shadow-sm border border-subtle p-6'>
            <h2 className='font-semibold text-ink mb-1'>Your details</h2>
            <p className='text-sm text-ink-muted mb-4'>
              Optional — leave blank to respond anonymously.
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor={`${formId}-name`}
                  className='block text-sm text-ink-2 mb-1'
                >
                  Name
                </label>
                <input
                  id={`${formId}-name`}
                  type='text'
                  autoComplete='name'
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder='Your full name'
                  className='w-full border border-subtle rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary'
                />
              </div>
              <div>
                <label
                  htmlFor={`${formId}-email`}
                  className='block text-sm text-ink-2 mb-1'
                >
                  Email
                </label>
                <input
                  id={`${formId}-email`}
                  type='email'
                  autoComplete='email'
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder='your@email.com'
                  className='w-full border border-subtle rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary'
                />
              </div>
            </div>
          </div>

          {/* Questions.

              Each question is a <fieldset> whose <legend> is the question
              text. Previously the question was a <p> floating above the
              controls with no programmatic relationship to them: the five
              rating buttons announced as "button, 1" … "button, 5" with no
              indication of what was being rated, which of them was chosen, or
              that they were five options for one answer. The free-text
              questions had a <textarea> with no label at all. */}
          {survey.questions.map((q, idx) => {
            const legendId = `${formId}-q${q.id}`;
            return (
              <fieldset
                key={q.id}
                className='bg-surface rounded-2xl shadow-sm border border-subtle p-6 m-0'
              >
                <div className='flex items-start gap-3 mb-4'>
                  <span
                    aria-hidden
                    className='flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center'
                  >
                    {idx + 1}
                  </span>
                  <legend className='flex-1 float-none p-0'>
                    <span id={legendId} className='block text-ink font-medium'>
                      <span className='sr-only'>
                        Question {idx + 1} of {survey.questions.length}.{' '}
                      </span>
                      {q.question}
                    </span>
                    {q.plo && (
                      <span
                        className='inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full'
                        title={q.plo.description}
                      >
                        {q.plo.code}: {q.plo.description.slice(0, 60)}
                        {q.plo.description.length > 60 ? '…' : ''}
                      </span>
                    )}
                  </legend>
                </div>

                {q.questionType === 'rating' ? (
                  <div
                    role='radiogroup'
                    aria-labelledby={legendId}
                    className='flex gap-2 flex-wrap'
                  >
                    {[1, 2, 3, 4, 5].map((val) => {
                      const chosen = answers[q.id]?.ratingValue === val;
                      return (
                        <button
                          key={val}
                          type='button'
                          role='radio'
                          aria-checked={chosen}
                          aria-label={`${val} out of 5`}
                          onClick={() => handleRating(q.id, val)}
                          className={`w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-colors ${
                            chosen
                              ? 'border-primary bg-primary text-accent-fg'
                              : 'border-subtle text-ink-2 hover:border-primary'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                    <div
                      aria-hidden
                      className='w-full flex justify-between text-xs text-ink-muted mt-1'
                    >
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    aria-labelledby={legendId}
                    value={answers[q.id]?.textValue || ''}
                    onChange={(e) => handleText(q.id, e.target.value)}
                    placeholder='Your answer…'
                    className='w-full border border-subtle rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-none'
                  />
                )}
              </fieldset>
            );
          })}

          {/* `role="alert"` so the message is announced when it appears —
              without it a keyboard or screen-reader user pressed Submit and
              got no feedback at all. */}
          {error && (
            <div
              role='alert'
              className='bg-bad-wash border border-bad text-ink px-4 py-3 rounded-lg text-sm'
            >
              {error}
            </div>
          )}

          {/* `hover:bg-primary` was the same colour as `bg-primary`, so the
              button had no hover state. */}
          <button
            type='submit'
            disabled={submitting}
            className='accent-btn w-full font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {submitting ? 'Submitting…' : 'Submit survey'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-muted mt-6">
          {survey.institutionName
            ? `${survey.institutionName} — powered by ${PRODUCT_NAME}`
            : PRODUCT_NAME}
        </p>
      </div>
    </div>
  );
}
