'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  ClipboardList,
  Plus,
  Trash2,
  PlayCircle,
  StopCircle,
  BarChart2,
  X,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CourseOffering {
  id: number;
  course: { code: string; name: string };
  semester: { name: string };
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Plo {
  id: number;
  code: string;
}

interface Question {
  id?: number;
  question: string;
  questionType: 'rating' | 'text';
  ploId: string;
}

type SurveyType = 'course_exit' | 'program_exit' | 'alumni' | 'employer';

const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  course_exit: 'Course Exit',
  program_exit: 'Program Exit',
  alumni: 'Alumni',
  employer: 'Employer',
};

const SURVEY_TYPE_COLORS: Record<SurveyType, string> = {
  course_exit: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  program_exit: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  alumni: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  employer: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
};

interface Survey {
  id: number;
  title: string;
  description: string | null;
  type: SurveyType;
  status: 'draft' | 'active' | 'closed';
  dueDate: string | null;
  courseOffering: CourseOffering | null;
  program: Program | null;
  creator: { first_name: string; last_name: string };
  _count: { questions: number; responses: number };
}

interface SurveyResult {
  surveyId: number;
  surveyTitle: string;
  totalResponses: number;
  questionResults: {
    questionId: number;
    question: string;
    questionType: string;
    plo: { id: number; code: string } | null;
    totalAnswers: number;
    avgRating: number | null;
    ratingDistribution: { rating: number; count: number }[] | null;
    textAnswers: string[];
  }[];
  ploAttainments: { ploCode: string; estimatedAttainment: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function AdminSurveysPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252,153,40,0.15)' : 'rgba(38,40,149,0.15)';

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [plos, setPlos] = useState<Plo[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [surveyScope, setSurveyScope] = useState<'course' | 'program'>('course');
  const [form, setForm] = useState({ title: '', description: '', type: 'course_exit' as SurveyType, courseOfferingId: '', programId: '', dueDate: '' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQ, setNewQ] = useState<Question>({ question: '', questionType: 'rating', ploId: '' });
  const [saving, setSaving] = useState(false);

  // Results dialog
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultData, setResultData] = useState<SurveyResult | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Send invitations dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSurvey, setInviteSurvey] = useState<Survey | null>(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ sent: number; failed: string[] } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, coRes, progRes] = await Promise.all([
          fetch('/api/surveys', { credentials: 'include' }),
          fetch('/api/course-offerings', { credentials: 'include' }),
          fetch('/api/programs', { credentials: 'include' }),
        ]);
        if (sRes.ok) {
          const d = await sRes.json();
          setSurveys(d.data ?? []);
        }
        if (coRes.ok) {
          const d = await coRes.json();
          setCourseOfferings(d.data ?? []);
        }
        if (progRes.ok) {
          const d = await progRes.json();
          setPrograms(d.data ?? d ?? []);
        }
      } catch {
        toast.error('Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load PLOs when course offering or program is selected
  useEffect(() => {
    if (surveyScope === 'course') {
      if (!form.courseOfferingId) { setPlos([]); return; }
      fetch(`/api/plos?courseOfferingId=${form.courseOfferingId}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => setPlos(Array.isArray(d) ? d : d.data ?? []))
        .catch(() => setPlos([]));
    } else {
      if (!form.programId) { setPlos([]); return; }
      fetch(`/api/programs/${form.programId}/plos`, { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => setPlos(Array.isArray(d) ? d : d.data ?? []))
        .catch(() => setPlos([]));
    }
  }, [form.courseOfferingId, form.programId, surveyScope]);

  const handleCreate = async () => {
    if (!form.title) {
      toast.error('Survey title is required');
      return;
    }
    if (surveyScope === 'course' && !form.courseOfferingId) {
      toast.error('Please select a course offering');
      return;
    }
    if (surveyScope === 'program' && !form.programId) {
      toast.error('Please select a program');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        dueDate: form.dueDate,
        courseOfferingId: surveyScope === 'course' ? form.courseOfferingId : undefined,
        programId: surveyScope === 'program' ? form.programId : undefined,
      };
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      const surveyId = data.data.id;

      // Add questions
      for (const q of questions) {
        await fetch(`/api/surveys/${surveyId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            question: q.question,
            questionType: q.questionType,
            ploId: q.ploId || undefined,
          }),
        });
      }

      toast.success('Survey created successfully');
      setCreateOpen(false);
      setForm({ title: '', description: '', type: 'course_exit', courseOfferingId: '', programId: '', dueDate: '' });
      setQuestions([]);
      setSurveyScope('course');
      // Refresh
      const sRes = await fetch('/api/surveys', { credentials: 'include' });
      const sData = await sRes.json();
      setSurveys(sData.data ?? []);
    } catch {
      toast.error('Failed to create survey');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (surveyId: number, status: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error('Failed to update status'); return; }
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, status: status as Survey['status'] } : s))
      );
      toast.success(`Survey ${status === 'active' ? 'activated' : 'closed'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (surveyId: number) => {
    if (!confirm('Delete this survey? All responses will be lost.')) return;
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { toast.error('Failed to delete'); return; }
      setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
      toast.success('Survey deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleViewResults = async (surveyId: number) => {
    setResultsLoading(true);
    setResultsOpen(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/results`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setResultData(data.data);
      else toast.error('Failed to load results');
    } catch {
      toast.error('Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    if (!inviteSurvey) return;
    const rawEmails = inviteEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (rawEmails.length === 0) {
      toast.error('Enter at least one email address');
      return;
    }
    setInviteSending(true);
    setInviteResult(null);
    try {
      const res = await fetch(`/api/surveys/${inviteSurvey.id}/send-invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emails: rawEmails, customMessage: inviteMessage || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInviteResult({ sent: data.data.sent, failed: data.data.failed });
        toast.success(`${data.data.sent} invitation${data.data.sent !== 1 ? 's' : ''} sent`);
      } else {
        toast.error(data.error || 'Failed to send invitations');
      }
    } catch {
      toast.error('Failed to send invitations');
    } finally {
      setInviteSending(false);
    }
  };

  const addQuestion = () => {
    if (!newQ.question.trim()) { toast.error('Enter a question'); return; }
    setQuestions((prev) => [...prev, { ...newQ }]);
    setNewQ({ question: '', questionType: 'rating', ploId: '' });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBgColor }}>
            <ClipboardList className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">Surveys</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Create indirect assessment surveys linked to PLOs
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
          variant="ghost"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Create Survey
        </Button>
      </div>

      {/* Survey list */}
      {loading ? (
        <div className="rounded-lg border border-card-border bg-card p-8 flex justify-center">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }} />
        </div>
      ) : surveys.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center text-xs text-secondary-text">
          No surveys yet. Create one to collect indirect assessment feedback.
        </div>
      ) : (
        <div className="space-y-2">
          {surveys.map((survey) => (
            <div key={survey.id} className="rounded-lg border border-card-border bg-card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-primary-text truncate">{survey.title}</p>
                  <Badge className={`text-[10px] h-4 px-1.5 border ${STATUS_COLORS[survey.status]}`}>
                    {survey.status}
                  </Badge>
                  <Badge className={`text-[10px] h-4 px-1.5 border ${SURVEY_TYPE_COLORS[survey.type ?? 'course_exit']}`}>
                    {SURVEY_TYPE_LABELS[survey.type ?? 'course_exit']}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-text mt-0.5">
                  {survey.courseOffering
                    ? `${survey.courseOffering.course.code} · ${survey.courseOffering.semester.name}`
                    : survey.program
                    ? `Program: ${survey.program.code} — ${survey.program.name}`
                    : 'General Survey'}{' '}
                  · {survey._count.questions} questions · {survey._count.responses} responses
                </p>
                {survey.dueDate && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Due: {new Date(survey.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {survey.status === 'draft' && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => handleStatusChange(survey.id, 'active')}>
                    <PlayCircle className="h-3.5 w-3.5 mr-1" /> Activate
                  </Button>
                )}
                {survey.status === 'active' && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleStatusChange(survey.id, 'closed')}>
                    <StopCircle className="h-3.5 w-3.5 mr-1" /> Close
                  </Button>
                )}
                {survey.status === 'active' && (survey.type === 'alumni' || survey.type === 'employer') && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-hover-bg"
                    style={{ color: primaryColor }}
                    onClick={() => {
                      setInviteSurvey(survey);
                      setInviteEmails('');
                      setInviteMessage('');
                      setInviteResult(null);
                      setInviteOpen(true);
                    }}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Invite
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs text-primary-text hover:bg-hover-bg"
                  onClick={() => handleViewResults(survey.id)}>
                  <BarChart2 className="h-3.5 w-3.5 mr-1" /> Results
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => handleDelete(survey.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE DIALOG ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">Create Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Survey Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. CS101 Course Exit Survey" className="h-8 text-xs bg-card border-card-border text-primary-text" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description" rows={2}
                className="text-xs bg-card border-card-border text-primary-text resize-none" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Survey Type * <span className="font-normal text-secondary-text">(HEC indirect assessment category)</span></Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SurveyType })}>
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  <SelectItem value="course_exit" className="text-xs text-primary-text">Course Exit Survey — per course, per semester</SelectItem>
                  <SelectItem value="program_exit" className="text-xs text-primary-text">Program Exit Survey — graduating students</SelectItem>
                  <SelectItem value="alumni" className="text-xs text-primary-text">Alumni Survey — 1–3 years post-graduation</SelectItem>
                  <SelectItem value="employer" className="text-xs text-primary-text">Employer Survey — employer feedback on graduates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-secondary-text">Survey Scope *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSurveyScope('course')}
                  className={`flex-1 h-8 text-xs rounded-md border transition-colors ${surveyScope === 'course' ? 'border-transparent text-white' : 'border-card-border text-primary-text'}`}
                  style={surveyScope === 'course' ? { backgroundColor: primaryColor } : {}}
                >
                  Course-Level
                </button>
                <button
                  type="button"
                  onClick={() => setSurveyScope('program')}
                  className={`flex-1 h-8 text-xs rounded-md border transition-colors ${surveyScope === 'program' ? 'border-transparent text-white' : 'border-card-border text-primary-text'}`}
                  style={surveyScope === 'program' ? { backgroundColor: primaryColor } : {}}
                >
                  Program Exit Survey
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                {surveyScope === 'course' ? (
                  <>
                    <Label className="text-xs text-secondary-text">Course Offering *</Label>
                    <Select value={form.courseOfferingId} onValueChange={(v) => setForm({ ...form, courseOfferingId: v })}>
                      <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        {courseOfferings.map((co) => (
                          <SelectItem key={co.id} value={co.id.toString()} className="text-primary-text text-xs">
                            {co.course.code} ({co.semester.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Label className="text-xs text-secondary-text">Program *</Label>
                    <Select value={form.programId} onValueChange={(v) => setForm({ ...form, programId: v })}>
                      <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-card-border">
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()} className="text-primary-text text-xs">
                            {p.code} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-secondary-text">Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="h-8 text-xs bg-card border-card-border text-primary-text" />
              </div>
            </div>

            {/* Questions */}
            <div className="border-t border-card-border pt-4">
              <p className="text-xs font-semibold text-primary-text mb-3">Questions ({questions.length})</p>
              <div className="space-y-2 mb-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-hover-bg p-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary-text">{q.question}</p>
                      <p className="text-[10px] text-secondary-text mt-0.5">
                        {q.questionType === 'rating' ? 'Rating (1–5)' : 'Text'}
                        {q.ploId && plos.find((p) => p.id.toString() === q.ploId)
                          ? ` · PLO: ${plos.find((p) => p.id.toString() === q.ploId)?.code}`
                          : ''}
                      </p>
                    </div>
                    <button onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-secondary-text hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add question form */}
              <div className="rounded-lg border border-dashed border-card-border p-3 space-y-2">
                <p className="text-[11px] text-secondary-text font-medium">Add a question</p>
                <Input value={newQ.question} onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                  placeholder="e.g. How well did this course help achieve PLO-1?" className="h-8 text-xs bg-card border-card-border text-primary-text" />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newQ.questionType} onValueChange={(v) => setNewQ({ ...newQ, questionType: v as 'rating' | 'text' })}>
                    <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="rating" className="text-xs text-primary-text">Rating (1–5)</SelectItem>
                      <SelectItem value="text" className="text-xs text-primary-text">Text Response</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newQ.ploId} onValueChange={(v) => setNewQ({ ...newQ, ploId: v })}>
                    <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                      <SelectValue placeholder="Link to PLO (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-card-border">
                      <SelectItem value="" className="text-xs text-primary-text">No PLO link</SelectItem>
                      {plos.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()} className="text-xs text-primary-text">{p.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="outline" onClick={addQuestion} className="h-7 text-xs border-card-border text-primary-text">
                  <Plus className="h-3 w-3 mr-1" /> Add Question
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)} className="h-8 text-xs border-card-border text-primary-text">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={saving} className="h-8 text-xs text-white"
                style={{ backgroundColor: primaryColor }}>
                {saving ? 'Creating...' : 'Create Survey'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── SEND INVITATIONS DIALOG ── */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteResult(null); }}>
        <DialogContent className="max-w-lg bg-card border-card-border text-primary-text p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text flex items-center gap-2">
              <Send className="h-4 w-4" style={{ color: primaryColor }} />
              Send Survey Invitations
            </DialogTitle>
          </DialogHeader>
          {inviteSurvey && (
            <div className="space-y-4 mt-2">
              <div className="rounded-lg bg-hover-bg p-3">
                <p className="text-xs font-medium text-primary-text">{inviteSurvey.title}</p>
                <p className="text-[10px] text-secondary-text mt-0.5 capitalize">{inviteSurvey.type.replace('_', ' ')} survey</p>
              </div>

              {inviteResult ? (
                <div className="space-y-3">
                  <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm font-semibold text-emerald-600">{inviteResult.sent} invitation{inviteResult.sent !== 1 ? 's' : ''} sent successfully</p>
                  </div>
                  {inviteResult.failed.length > 0 && (
                    <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20">
                      <p className="text-xs font-medium text-red-600 mb-1">{inviteResult.failed.length} failed to send:</p>
                      <p className="text-xs text-red-500">{inviteResult.failed.join(', ')}</p>
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setInviteResult(null); setInviteEmails(''); }}
                    className="h-8 text-xs border-card-border text-primary-text">
                    Send to More
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-secondary-text">
                      Email Addresses * <span className="font-normal">(one per line or comma-separated, max 200)</span>
                    </Label>
                    <textarea
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="alumni@example.com&#10;employer@company.com&#10;..."
                      rows={5}
                      className="w-full rounded-md border border-card-border bg-card text-primary-text text-xs p-2 resize-none placeholder:text-secondary-text focus:outline-none focus:ring-1"
                      style={{ ['--tw-ring-color' as string]: primaryColor }}
                    />
                    <p className="text-[10px] text-secondary-text">
                      {inviteEmails.split(/[\n,]+/).filter((e) => e.trim()).length} email(s) entered
                    </p>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-secondary-text">Custom Message (optional)</Label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Add a personal message to include in the invitation email..."
                      rows={2}
                      className="w-full rounded-md border border-card-border bg-card text-primary-text text-xs p-2 resize-none placeholder:text-secondary-text focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setInviteOpen(false)}
                      className="h-8 text-xs border-card-border text-primary-text">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSendInvitations} disabled={inviteSending}
                      className="h-8 text-xs text-white disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}>
                      {inviteSending ? 'Sending...' : `Send Invitations`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── RESULTS DIALOG ── */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-2xl bg-card border-card-border text-primary-text p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary-text">
              {resultData ? resultData.surveyTitle : 'Survey Results'}
            </DialogTitle>
          </DialogHeader>
          {resultsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }} />
            </div>
          ) : resultData ? (
            <div className="space-y-4 mt-2">
              <p className="text-xs text-secondary-text">
                Total responses: <span className="font-medium text-primary-text">{resultData.totalResponses}</span>
              </p>

              {resultData.ploAttainments.length > 0 && (
                <div className="rounded-lg bg-hover-bg p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary-text">Indirect PLO Attainment Estimate</p>
                  {resultData.ploAttainments.map((pa) => (
                    <div key={pa.ploCode} className="flex items-center gap-2">
                      <span className="text-xs text-secondary-text w-16">{pa.ploCode}</span>
                      <div className="flex-1 bg-card rounded-full h-2 border border-card-border">
                        <div className="h-2 rounded-full" style={{ width: `${pa.estimatedAttainment}%`, backgroundColor: primaryColor }} />
                      </div>
                      <span className="text-xs font-medium text-primary-text w-12 text-right">{pa.estimatedAttainment}%</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {resultData.questionResults.map((qr) => (
                  <div key={qr.questionId} className="rounded-lg border border-card-border p-3 space-y-2">
                    <p className="text-xs font-medium text-primary-text">{qr.question}</p>
                    <p className="text-[10px] text-secondary-text">
                      {qr.totalAnswers} answer{qr.totalAnswers !== 1 ? 's' : ''}
                      {qr.plo && ` · PLO: ${qr.plo.code}`}
                    </p>
                    {qr.questionType === 'rating' && qr.ratingDistribution && (
                      <div className="space-y-1">
                        <p className="text-[11px] text-secondary-text">
                          Average rating: <span className="font-semibold text-primary-text">{qr.avgRating ?? '—'} / 5</span>
                        </p>
                        {qr.ratingDistribution.map((rd) => (
                          <div key={rd.rating} className="flex items-center gap-2">
                            <span className="text-[10px] text-secondary-text w-8">{rd.rating}★</span>
                            <div className="flex-1 bg-card border border-card-border rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{
                                width: qr.totalAnswers > 0 ? `${(rd.count / qr.totalAnswers) * 100}%` : '0%',
                                backgroundColor: primaryColor,
                              }} />
                            </div>
                            <span className="text-[10px] text-secondary-text w-6 text-right">{rd.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {qr.questionType === 'text' && qr.textAnswers.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {qr.textAnswers.map((t, i) => (
                          <p key={i} className="text-[11px] text-secondary-text bg-hover-bg rounded px-2 py-1">{t}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-secondary-text py-4 text-center">No data available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
