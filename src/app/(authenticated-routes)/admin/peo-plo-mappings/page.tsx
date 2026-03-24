'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Link, Target } from 'lucide-react';

interface Mapping {
  id: number;
  peoId: number;
  ploId: number;
  peo: { id: number; code: string; description: string };
  plo: { id: number; code: string; description: string; bloomLevel?: string; bloomDomain?: string };
}

interface PEO {
  id: number;
  code: string;
  description: string;
  programId: number;
  ploMappings: Mapping[];
}

interface PLO {
  id: number;
  code: string;
  description: string;
  bloomLevel?: string;
  program: { id: number; name: string; code: string };
}

interface Program {
  id: number;
  name: string;
  code: string;
}

function PEOPLOMappingsPageContent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  const searchParams = useSearchParams();
  const highlightedPeoId = searchParams.get('peoId')
    ? Number(searchParams.get('peoId'))
    : null;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [peos, setPEOs] = useState<PEO[]>([]);
  const [plos, setPLOs] = useState<PLO[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // "Add PLO" dialog state — one dialog shared, contextualised by activePeo
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activePeo, setActivePeo] = useState<PEO | null>(null);
  const [selectedPLO, setSelectedPLO] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<{
    id: number;
    peoCode: string;
    ploCode: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      setIsLoading(true);
      Promise.all([
        fetchPEOs(selectedProgram),
        fetchPLOs(selectedProgram),
        fetchMappings(selectedProgram),
      ]).finally(() => setIsLoading(false));
    } else {
      setPEOs([]);
      setPLOs([]);
      setMappings([]);
      setIsLoading(false);
    }
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setPrograms(data.data);
        // Auto-select first program if none selected yet
        if (data.data.length > 0 && !selectedProgram) {
          setSelectedProgram(data.data[0].id.toString());
        }
      } else {
        toast.error(data.error || 'Failed to fetch programs');
      }
    } catch {
      toast.error('Failed to fetch programs');
    }
  };

  const fetchPEOs = async (programId: string) => {
    try {
      const response = await fetch(`/api/peos?programId=${programId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      // /api/peos returns a plain array (not { success, data })
      if (Array.isArray(data)) {
        setPEOs(data);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to fetch PEOs');
    }
  };

  const fetchPLOs = async (programId: string) => {
    try {
      const response = await fetch(`/api/plos?programId=${programId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setPLOs(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch PLOs');
      }
    } catch {
      toast.error('Failed to fetch PLOs');
    }
  };

  const fetchMappings = async (programId: string) => {
    try {
      const response = await fetch(`/api/peo-plo-mappings?programId=${programId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      // /api/peo-plo-mappings returns a plain array
      if (Array.isArray(data)) {
        setMappings(data);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to fetch mappings');
    }
  };

  const refreshData = () => {
    if (!selectedProgram) return;
    Promise.all([fetchPEOs(selectedProgram), fetchMappings(selectedProgram)]);
  };

  // Compute mapped PLO ids for a given PEO from the mappings list
  const getMappedPLOsForPEO = (peoId: number): Mapping[] => {
    return mappings.filter((m) => m.peoId === peoId);
  };

  // PLOs not yet mapped to the given PEO
  const getUnmappedPLOs = (peoId: number): PLO[] => {
    const mappedPloIds = getMappedPLOsForPEO(peoId).map((m) => m.ploId);
    return plos.filter((p) => !mappedPloIds.includes(p.id));
  };

  const openAddDialog = (peo: PEO) => {
    setActivePeo(peo);
    setSelectedPLO('');
    setIsAddDialogOpen(true);
  };

  const handleAddMapping = async () => {
    if (!activePeo || !selectedPLO) {
      toast.error('Please select a PLO');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/peo-plo-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          peoId: activePeo.id,
          ploId: Number(selectedPLO),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Mapping added successfully');
        setIsAddDialogOpen(false);
        setActivePeo(null);
        setSelectedPLO('');
        refreshData();
      } else {
        toast.error(data.error || 'Failed to add mapping');
      }
    } catch {
      toast.error('Failed to add mapping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (mapping: Mapping) => {
    setMappingToDelete({
      id: mapping.id,
      peoCode: mapping.peo.code,
      ploCode: mapping.plo.code,
    });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMapping = async () => {
    if (!mappingToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/peo-plo-mappings/${mappingToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Mapping removed successfully');
        setIsDeleteDialogOpen(false);
        setMappingToDelete(null);
        refreshData();
      } else {
        toast.error(data.error || 'Failed to remove mapping');
      }
    } catch {
      toast.error('Failed to remove mapping');
    } finally {
      setIsDeleting(false);
    }
  };

  // Badge color cycling for PLO badges
  const PLO_BADGE_COLORS = [
    { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
    { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' },
    { bg: 'rgba(20, 184, 166, 0.12)', color: '#14b8a6', border: 'rgba(20, 184, 166, 0.3)' },
  ];

  const getPLOBadgeColor = (index: number) =>
    PLO_BADGE_COLORS[index % PLO_BADGE_COLORS.length];

  if (!mounted) {
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
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedProgramData = programs.find((p) => p.id.toString() === selectedProgram);

  const totalMappings = mappings.length;
  const unmappedPEOs = peos.filter(
    (peo) => getMappedPLOsForPEO(peo.id).length === 0
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">PEO-PLO Mappings</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Manage mappings between Program Educational Objectives (PEO) and Program Learning
            Outcomes (PLO)
          </p>
        </div>
        {selectedProgram && (
          <div className="flex items-center gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
            >
              <Link className="w-3.5 h-3.5" />
              {totalMappings} mapping{totalMappings !== 1 ? 's' : ''}
            </div>
            {unmappedPEOs > 0 && (
              <div className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 bg-[var(--warning-opacity-10)] text-[var(--warning)]">
                <Target className="w-3.5 h-3.5" />
                {unmappedPEOs} PEO{unmappedPEOs !== 1 ? 's' : ''} unmapped
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program filter */}
      <div className="flex items-center gap-3">
        <div className="w-[260px]">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
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
                  {program.name} ({program.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedProgramData && (
          <p className="text-xs text-secondary-text">
            Showing PEO-PLO mappings for{' '}
            <span className="font-medium text-primary-text">
              {selectedProgramData.name}
            </span>
          </p>
        )}
      </div>

      {/* Content */}
      {!selectedProgram ? (
        <div className="rounded-lg border border-card-border bg-card p-12">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: iconBgColor }}
            >
              <Link className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <p className="text-sm font-medium text-primary-text">Select a Program</p>
            <p className="text-xs text-secondary-text max-w-xs">
              Choose a program from the dropdown above to view and manage its PEO-PLO mappings.
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-3">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderTopColor: primaryColor,
                borderBottomColor: primaryColor,
                borderRightColor: 'transparent',
                borderLeftColor: 'transparent',
              }}
            />
            <p className="text-xs text-secondary-text">Loading mappings...</p>
          </div>
        </div>
      ) : peos.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card p-12">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: iconBgColor }}
            >
              <Target className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <p className="text-sm font-medium text-primary-text">No PEOs Found</p>
            <p className="text-xs text-secondary-text max-w-xs">
              No Program Educational Objectives have been created for this program yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {peos.map((peo) => {
            const peoMappings = getMappedPLOsForPEO(peo.id);
            const unmappedPLOs = getUnmappedPLOs(peo.id);
            const isHighlighted = highlightedPeoId === peo.id;

            return (
              <div
                key={peo.id}
                className="rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md"
                style={{
                  borderColor: isHighlighted ? primaryColor : 'var(--card-border)',
                  boxShadow: isHighlighted
                    ? `0 0 0 2px ${isDarkMode ? 'rgba(252, 153, 40, 0.3)' : 'rgba(38, 40, 149, 0.3)'}`
                    : undefined,
                }}
              >
                {/* Card Header */}
                <div
                  className="px-4 py-3 border-b border-card-border"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: isDarkMode
                              ? 'rgba(252, 153, 40, 0.25)'
                              : 'rgba(38, 40, 149, 0.2)',
                            color: primaryColor,
                          }}
                        >
                          {peo.code}
                        </span>
                        {isHighlighted && (
                          <span className="text-[10px] text-secondary-text italic">
                            highlighted
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-primary-text leading-relaxed line-clamp-2">
                        {peo.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className="text-[10px] font-medium px-2 py-1 rounded"
                        style={{ backgroundColor: iconBgColor, color: primaryColor }}
                      >
                        {peoMappings.length} PLO{peoMappings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body — mapped PLOs */}
                <div className="px-4 py-3 min-h-[72px]">
                  {peoMappings.length === 0 ? (
                    <p className="text-[11px] text-secondary-text italic">
                      No PLOs mapped yet. Use the button below to add mappings.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {peoMappings.map((mapping, idx) => {
                        const badgeColor = getPLOBadgeColor(idx);
                        return (
                          <div
                            key={mapping.id}
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all group"
                            style={{
                              backgroundColor: badgeColor.bg,
                              color: badgeColor.color,
                              borderColor: badgeColor.border,
                            }}
                            title={mapping.plo.description}
                          >
                            <span>{mapping.plo.code}</span>
                            {mapping.plo.bloomLevel && (
                              <span className="opacity-60 text-[10px]">
                                · {mapping.plo.bloomLevel}
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteClick(mapping)}
                              className="ml-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                              title={`Remove ${mapping.plo.code} mapping`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-2.5 border-t border-card-border">
                  <button
                    onClick={() => openAddDialog(peo)}
                    disabled={unmappedPLOs.length === 0}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: primaryColor }}
                    onMouseEnter={(e) => {
                      if (unmappedPLOs.length > 0) {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '0.75';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {unmappedPLOs.length === 0 && plos.length > 0
                      ? 'All PLOs mapped'
                      : unmappedPLOs.length === 0 && plos.length === 0
                      ? 'No PLOs available'
                      : 'Add PLO mapping'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Mapping Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-card-border max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Add PLO Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              {activePeo
                ? `Map a PLO to ${activePeo.code} — ${activePeo.description.substring(0, 60)}${
                    activePeo.description.length > 60 ? '...' : ''
                  }`
                : 'Map a Program Learning Outcome to the selected PEO'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs text-primary-text">Program Learning Outcome (PLO) *</Label>
              <Select
                value={selectedPLO}
                onValueChange={setSelectedPLO}
                disabled={!activePeo || getUnmappedPLOs(activePeo?.id ?? 0).length === 0}
              >
                <SelectTrigger className="bg-card border-card-border text-primary-text">
                  <SelectValue
                    placeholder={
                      activePeo && getUnmappedPLOs(activePeo.id).length === 0
                        ? 'All PLOs already mapped'
                        : 'Select PLO'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card border-card-border">
                  {activePeo &&
                    getUnmappedPLOs(activePeo.id).map((plo) => (
                      <SelectItem
                        key={plo.id}
                        value={plo.id.toString()}
                        className="text-primary-text hover:bg-card/50"
                      >
                        <span className="font-medium">{plo.code}</span>
                        {' — '}
                        {plo.description.substring(0, 55)}
                        {plo.description.length > 55 ? '...' : ''}
                        {plo.bloomLevel && (
                          <span className="text-secondary-text"> · {plo.bloomLevel}</span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPLO && activePeo && (
              <div
                className="rounded-lg p-3 text-xs"
                style={{ backgroundColor: iconBgColor }}
              >
                {(() => {
                  const ploData = plos.find((p) => p.id === Number(selectedPLO));
                  if (!ploData) return null;
                  return (
                    <div className="space-y-1">
                      <p className="font-medium" style={{ color: primaryColor }}>
                        {ploData.code}
                      </p>
                      <p className="text-secondary-text leading-relaxed">{ploData.description}</p>
                      {ploData.bloomLevel && (
                        <p className="text-secondary-text">
                          Bloom&apos;s level:{' '}
                          <span className="text-primary-text">{ploData.bloomLevel}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setIsAddDialogOpen(false);
                setActivePeo(null);
                setSelectedPLO('');
              }}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddMapping}
              disabled={!selectedPLO || isSubmitting}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor, color: '#ffffff' }}
              onMouseEnter={(e) => {
                if (!isSubmitting && selectedPLO) {
                  e.currentTarget.style.backgroundColor = primaryColorDark;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Mapping'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-card-border p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-primary-text">
              Remove Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text mt-1">
              {mappingToDelete
                ? `Are you sure you want to remove the mapping between ${mappingToDelete.peoCode} and ${mappingToDelete.ploCode}? This action cannot be undone.`
                : 'Are you sure you want to remove this mapping? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <button
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setMappingToDelete(null);
              }}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 border bg-transparent"
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                borderColor: isDarkMode ? '#404040' : '#e5e7eb',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteMapping}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              onMouseEnter={(e) => {
                if (!isDeleting) e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PEOPLOMappingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-page">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin border-blue-500" />
            <p className="text-xs text-secondary-text">Loading...</p>
          </div>
        </div>
      }
    >
      <PEOPLOMappingsPageContent />
    </Suspense>
  );
}
