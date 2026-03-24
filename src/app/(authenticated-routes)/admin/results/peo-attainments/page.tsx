'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Info, Trophy, ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MappedPLO {
  ploId: number;
  ploCode: string;
  ploDescription: string;
  attainmentPercent: number | null;
}

interface PEOAttainment {
  peoId: number;
  code: string;
  description: string;
  status: string;
  mappedPLOs: MappedPLO[];
  avgAttainment: number | null;
  threshold: number;
  isAchieved: boolean | null;
  plosWithData: number;
  totalMappedPLOs: number;
}

interface Meta {
  programId: number;
  semesterId: number | null;
  threshold: number;
  hasPloData: boolean;
  message?: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface Semester {
  id: number;
  name: string;
  status: string;
}

function PEOAttainmentsContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PEOAttainment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [expandedPEOs, setExpandedPEOs] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    fetchPrograms();
    fetchSemesters();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setPrograms(json.data);
    } catch {
      toast.error('Failed to fetch programs');
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await fetch('/api/semesters', { credentials: 'include' });
      const json = await res.json();
      if (json.success) setSemesters(json.data);
    } catch {
      toast.error('Failed to fetch semesters');
    }
  };

  const fetchPEOAttainments = async () => {
    if (!selectedProgram) {
      toast.error('Please select a program');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ programId: selectedProgram });
      if (selectedSemester) params.set('semesterId', selectedSemester);
      const res = await fetch(`/api/peo-attainments?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setMeta(json.meta);
        if (json.meta?.message) toast.info(json.meta.message);
      } else {
        toast.error(json.error || 'Failed to fetch PEO attainments');
      }
    } catch {
      toast.error('Failed to fetch PEO attainments');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (peoId: number) => {
    setExpandedPEOs((prev) => {
      const next = new Set(prev);
      next.has(peoId) ? next.delete(peoId) : next.add(peoId);
      return next;
    });
  };

  const achieved = data.filter((p) => p.isAchieved === true).length;
  const notAchieved = data.filter((p) => p.isAchieved === false).length;
  const noData = data.filter((p) => p.isAchieved === null).length;

  const chartData = data
    .filter((p) => p.avgAttainment !== null)
    .map((p) => ({
      name: p.code,
      attainment: p.avgAttainment as number,
      achieved: (p.avgAttainment as number) >= p.threshold,
    }));

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-primary-text">PEO Attainments</h1>
        <p className="text-xs text-secondary-text mt-0.5">
          Program Educational Objective achievement derived from PLO attainments
        </p>
      </div>

      {/* Info Banner */}
      <div
        className="flex items-start gap-2 p-3 rounded-lg border text-xs"
        style={{
          backgroundColor: isDarkMode ? 'rgba(252, 153, 40, 0.08)' : 'rgba(38, 40, 149, 0.06)',
          borderColor: isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.15)',
          color: primaryColor,
        }}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          PEO attainment is automatically derived from PLO attainments. Each PEO&apos;s achievement is the
          average attainment of its mapped PLOs. You must calculate PLO attainments first.
        </span>
      </div>

      {/* Selectors */}
      <div className="flex items-end gap-3">
        <div className="w-60">
          <p className="text-xs text-secondary-text mb-1">Program *</p>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()} className="text-xs text-primary-text">
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-52">
          <p className="text-xs text-secondary-text mb-1">Semester (optional)</p>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="h-8 text-xs bg-card border-card-border text-primary-text">
              <SelectValue placeholder="Latest available" />
            </SelectTrigger>
            <SelectContent className="bg-card border-card-border">
              <SelectItem value="" className="text-xs text-primary-text">Latest available</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()} className="text-xs text-primary-text">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={fetchPEOAttainments}
          disabled={!selectedProgram || loading}
          className="px-4 py-1.5 rounded-lg text-xs font-medium h-8 disabled:opacity-50"
          style={{ backgroundColor: primaryColor, color: '#ffffff' }}
        >
          {loading ? 'Loading...' : 'Calculate'}
        </button>
      </div>

      {data.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total PEOs', value: data.length, icon: Trophy, color: primaryColor, bg: iconBgColor },
              { label: 'Achieved', value: achieved, icon: CheckCircle, color: 'var(--success-green)', bg: 'rgba(34,197,94,0.1)' },
              { label: 'Below Threshold', value: notAchieved, icon: AlertTriangle, color: 'var(--error)', bg: 'var(--error-opacity-10)' },
              { label: 'No Data', value: noData, icon: Info, color: 'var(--gray-500)', bg: 'rgba(107,114,128,0.1)' },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-card-border bg-card p-3 flex items-center gap-3">
                <div className="rounded-lg p-2" style={{ backgroundColor: card.bg }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-primary-text">{card.value}</p>
                  <p className="text-[10px] text-secondary-text">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card p-4">
              <h3 className="text-xs font-semibold text-primary-text mb-3">PEO Attainment Chart</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: '1px solid #374151', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attainment']}
                  />
                  <ReferenceLine
                    y={meta?.threshold ?? 50}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: `Threshold ${meta?.threshold ?? 50}%`, position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
                  />
                  <Bar dataKey="attainment" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.achieved ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left p-3 font-semibold text-primary-text w-6"></th>
                  <th className="text-left p-3 font-semibold text-primary-text">PEO Code</th>
                  <th className="text-left p-3 font-semibold text-primary-text">Description</th>
                  <th className="text-left p-3 font-semibold text-primary-text">Mapped PLOs</th>
                  <th className="text-left p-3 font-semibold text-primary-text">Avg Attainment</th>
                  <th className="text-left p-3 font-semibold text-primary-text">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((peo) => (
                  <>
                    <tr
                      key={peo.peoId}
                      className="border-b border-card-border hover:bg-hover-bg cursor-pointer"
                      onClick={() => peo.mappedPLOs.length > 0 && toggleExpand(peo.peoId)}
                    >
                      <td className="p-3 text-secondary-text">
                        {peo.mappedPLOs.length > 0 && (
                          expandedPEOs.has(peo.peoId)
                            ? <ChevronDown className="w-3 h-3" />
                            : <ChevronRight className="w-3 h-3" />
                        )}
                      </td>
                      <td className="p-3 font-medium text-primary-text">{peo.code}</td>
                      <td className="p-3 text-secondary-text max-w-sm truncate">{peo.description}</td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: iconBgColor, color: primaryColor }}
                        >
                          {peo.plosWithData}/{peo.totalMappedPLOs} PLOs
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-primary-text">
                        {peo.avgAttainment !== null ? `${peo.avgAttainment.toFixed(1)}%` : <span className="text-muted-text">—</span>}
                      </td>
                      <td className="p-3">
                        {peo.isAchieved === null ? (
                          <Badge className="bg-gray-500 text-white text-[10px] px-1.5 py-0.5" variant="secondary">No Data</Badge>
                        ) : peo.isAchieved ? (
                          <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5" variant="secondary">Achieved</Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5" variant="secondary">Below Threshold</Badge>
                        )}
                      </td>
                    </tr>
                    {expandedPEOs.has(peo.peoId) && peo.mappedPLOs.map((plo) => (
                      <tr key={plo.ploId} className="bg-hover-bg/50 border-b border-card-border/50">
                        <td className="p-2"></td>
                        <td colSpan={2} className="p-2 pl-6 text-secondary-text">
                          <span className="font-medium text-primary-text">{plo.ploCode}</span>
                          <span className="ml-2 text-muted-text truncate">{plo.ploDescription}</span>
                        </td>
                        <td className="p-2"></td>
                        <td className="p-2 text-secondary-text">
                          {plo.attainmentPercent !== null ? `${plo.attainmentPercent.toFixed(1)}%` : <span className="text-muted-text">Not calculated</span>}
                        </td>
                        <td className="p-2">
                          {plo.attainmentPercent !== null && (
                            <Badge
                              className={`text-[10px] px-1.5 py-0.5 ${plo.attainmentPercent >= (meta?.threshold ?? 50) ? 'bg-[var(--success-green)] text-white' : 'bg-red-500 text-white'}`}
                              variant="secondary"
                            >
                              {plo.attainmentPercent >= (meta?.threshold ?? 50) ? 'Met' : 'Not Met'}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && data.length === 0 && selectedProgram && (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <Trophy className="w-8 h-8 text-muted-text mx-auto mb-2" />
          <p className="text-xs text-secondary-text">
            No PEOs found. Add PEOs and map them to PLOs first, then calculate PLO attainments.
          </p>
        </div>
      )}

      {!selectedProgram && (
        <div className="rounded-lg border border-card-border bg-card p-8 text-center">
          <Trophy className="w-8 h-8 text-muted-text mx-auto mb-2" />
          <p className="text-xs text-secondary-text">Select a program to view PEO attainments</p>
        </div>
      )}
    </div>
  );
}

export default function PEOAttainmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PEOAttainmentsContent />
    </Suspense>
  );
}
