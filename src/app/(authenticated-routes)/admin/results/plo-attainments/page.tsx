'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, TrendingUp, BarChart3 } from 'lucide-react';
import { PLOAttainments } from '@/components/assessments/PLOAttainments';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
}

interface TrendSeries {
  ploId: number;
  ploCode: string;
  description: string;
  data: { semester: string; attainmentPercent: number | null }[];
}

interface TrendData {
  plos: { id: number; code: string; description: string }[];
  semesters: string[];
  series: TrendSeries[];
}

// Distinct colours for up to 10 PLO lines
const PLO_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];

const PLOAttainmentsPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const [activeTab, setActiveTab] = useState<'attainments' | 'trends'>('attainments');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Trend state
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [chartRows, setChartRows] = useState<Record<string, number | string>[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/programs', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch programs');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setPrograms(result.data);
        } else if (Array.isArray(result)) {
          setPrograms(result as Program[]);
        }
      } catch {
        toast.error('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await fetch('/api/semesters', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch semesters');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setSemesters(result.data);
        } else if (Array.isArray(result)) {
          setSemesters(result as Semester[]);
        }
      } catch {
        toast.error('Failed to load semesters');
      }
    };
    fetchSemesters();
  }, []);

  // Fetch trend data when program changes and trend tab is active
  useEffect(() => {
    if (!selectedProgram || activeTab !== 'trends') return;
    const fetchTrends = async () => {
      setTrendLoading(true);
      try {
        const res = await fetch(
          `/api/ploattainments/trends?programId=${selectedProgram}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('Failed to fetch trends');
        const result = await res.json();
        if (result.success) {
          setTrendData(result.data);
          // Build flat rows for Recharts: one row per semester
          const rows: Record<string, number | string>[] = result.data.semesters.map(
            (sem: string) => {
              const row: Record<string, number | string> = { semester: sem };
              for (const s of result.data.series as TrendSeries[]) {
                const point = s.data.find((d) => d.semester === sem);
                if (point && point.attainmentPercent !== null) {
                  row[s.ploCode] = Math.round(point.attainmentPercent * 10) / 10;
                }
              }
              return row;
            }
          );
          setChartRows(rows);
        }
      } catch {
        toast.error('Failed to load PLO trend data');
      } finally {
        setTrendLoading(false);
      }
    };
    fetchTrends();
  }, [selectedProgram, activeTab]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading PLO Attainments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <GraduationCap className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">PLO Attainments</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Track and analyze Program Learning Outcome achievements
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-card-border">
        {[
          { key: 'attainments', label: 'Per Semester', icon: BarChart3 },
          { key: 'trends', label: 'Trend Analysis', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-current text-primary-text'
                : 'border-transparent text-secondary-text hover:text-primary-text'
            }`}
            style={activeTab === key ? { borderBottomColor: primaryColor, color: primaryColor } : {}}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── PER-SEMESTER TAB ── */}
      {activeTab === 'attainments' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select
                value={selectedProgram}
                onValueChange={setSelectedProgram}
                disabled={!programs.length}
              >
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {programs.map((program) => (
                    <SelectItem
                      key={program.id}
                      value={program.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {program.code} - {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
                disabled={!semesters.length}
              >
                <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {semesters.map((semester) => (
                    <SelectItem
                      key={semester.id}
                      value={semester.id.toString()}
                      className="text-primary-text hover:bg-card/50"
                    >
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProgram && selectedSemester ? (
            <PLOAttainments
              programId={parseInt(selectedProgram)}
              semesterId={parseInt(selectedSemester)}
            />
          ) : (
            <div className="rounded-lg border border-card-border bg-card p-8">
              <div className="text-center text-xs text-secondary-text">
                Please select a program and semester to view PLO attainments
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TREND ANALYSIS TAB ── */}
      {activeTab === 'trends' && (
        <>
          <div className="flex-1 max-w-xs">
            <Select
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              disabled={!programs.length}
            >
              <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
                <SelectValue placeholder="Select a program to view trends" />
              </SelectTrigger>
              <SelectContent className="bg-card border-card-border">
                {programs.map((program) => (
                  <SelectItem
                    key={program.id}
                    value={program.id.toString()}
                    className="text-primary-text hover:bg-card/50"
                  >
                    {program.code} - {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedProgram ? (
            <div className="rounded-lg border border-card-border bg-card p-8">
              <div className="text-center text-xs text-secondary-text">
                Select a program to view PLO attainment trends across semesters
              </div>
            </div>
          ) : trendLoading ? (
            <div className="rounded-lg border border-card-border bg-card p-8 flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
              />
              <p className="text-xs text-secondary-text">Loading trend data...</p>
            </div>
          ) : !trendData || trendData.semesters.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card p-8">
              <div className="text-center text-xs text-secondary-text">
                No PLO attainment data found for this program. Calculate attainments first.
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-card-border bg-card p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-primary-text">PLO Attainment Trends</p>
                <p className="text-xs text-secondary-text mt-0.5">
                  Semester-over-semester attainment % for each PLO. Dashed line = 60% threshold.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartRows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                  />
                  <XAxis
                    dataKey="semester"
                    tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => [`${value}%`, undefined]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {/* 60% threshold line */}
                  <ReferenceLine
                    y={60}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: '60% threshold', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
                  />
                  {trendData.series.map((s, i) => (
                    <Line
                      key={s.ploId}
                      type="monotone"
                      dataKey={s.ploCode}
                      stroke={PLO_COLORS[i % PLO_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* PLO legend table */}
              <div className="border-t border-card-border pt-3">
                <p className="text-xs font-medium text-secondary-text mb-2">PLO Reference</p>
                <div className="space-y-1">
                  {trendData.series.map((s, i) => (
                    <div key={s.ploId} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PLO_COLORS[i % PLO_COLORS.length] }}
                      />
                      <p className="text-[11px] text-secondary-text">
                        <span className="font-medium text-primary-text">{s.ploCode}</span>
                        {' — '}
                        {s.description.length > 100
                          ? s.description.slice(0, 100) + '…'
                          : s.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PLOAttainmentsPage;
