'use client';

import { useEffect, useState } from 'react';
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
}

interface AnswerMap {
  [questionId: number]: { ratingValue?: number; textValue?: string };
}

export default function PublicSurveyPage() {
  const params = useParams();
  const token = params.token as string;

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
    fetch(`/api/surveys/respond-public?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSurvey(data);
        }
      })
      .catch(() => setError('Failed to load survey'))
      .finally(() => setLoading(false));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading survey...</div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Survey Unavailable</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500">Your response has been submitted successfully.</p>
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            {surveyTypeLabel[survey.type] ?? survey.type}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-500 text-sm">{survey.description}</p>
          )}
          {survey.dueDate && (
            <p className="text-gray-400 text-xs mt-2">
              Due: {new Date(survey.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Respondent info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Your Information (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">{q.question}</p>
                  {q.plo && (
                    <span className="inline-block mt-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      {q.plo.code}: {q.plo.description.slice(0, 60)}
                      {q.plo.description.length > 60 ? '…' : ''}
                    </span>
                  )}
                </div>
              </div>

              {q.questionType === 'rating' ? (
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleRating(q.id, val)}
                      className={`w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-colors ${
                        answers[q.id]?.ratingValue === val
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                  <div className="w-full flex justify-between text-xs text-gray-400 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              ) : (
                <textarea
                  rows={3}
                  value={answers[q.id]?.textValue || ''}
                  onChange={(e) => handleText(q.id, e.target.value)}
                  placeholder="Your answer..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              )}
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          EduTrack OBE System — MNS University
        </p>
      </div>
    </div>
  );
}
