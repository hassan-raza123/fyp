'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

interface Offering {
  id: number;
  course: { id: number; code: string; name: string };
  semester: { id: number; name: string } | null;
  sections: Array<{ id: number; name: string }>;
}

/**
 * Course files, listed by offering.
 *
 * The course file itself lives at
 * `/faculty/course-offerings/[id]/course-file`, which needs an offering id and
 * so cannot be a plain navigation entry. Without this index the page existed
 * but nothing in the product linked to it — a feature nobody can reach is a
 * feature nobody has.
 */
export default function CourseFilesPage() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/faculty/course-offerings', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error();
        const body = await res.json();
        const list = body.data ?? body.courseOfferings ?? body;
        if (!cancelled) setOfferings(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) toast.error('Could not load your course offerings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoading message="Loading course offerings..." fullScreen={false} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Course Files"
        subtitle="Accreditation evidence per course offering — CLO mapping, assessments, CEPs, attainment and CQI"
      />

      {offerings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-subtle p-10 text-center">
          <FileText className="w-6 h-6 text-ink-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-ink-2">No course offerings yet</p>
          <p className="text-xs text-ink-muted mt-1">
            A course file appears here once you are assigned to an offering.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-subtle bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Sections</th>
                  <th>Course File</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.course.code}</td>
                    <td>{o.course.name}</td>
                    <td>{o.semester?.name ?? '—'}</td>
                    <td>{o.sections?.length ?? 0}</td>
                    <td>
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                        <Link href={`/faculty/course-offerings/${o.id}/course-file`}>
                          <FileText className="w-3 h-3 mr-1.5" />
                          Open
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
