'use client';

import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import { PageHeader } from '@/components/ui/page-header';
import { PDF_ACCENT, PDF_WARN } from '@/constants/pdf-theme';
import { PRODUCT_NAME } from '@/constants/branding';

interface Section {
  heading: string;
  note?: string;
  columns: string[];
  rows: (string | number | null)[][];
}

interface CourseFile {
  generatedAt: string;
  courseOffering: {
    id: number;
    courseCode: string;
    courseName: string;
    creditHours: number | null;
    semester: string;
  };
  sections: Section[];
  findings: string[];
}

/**
 * The accreditation course file for one offering.
 *
 * A Programme Evaluator asks for this, not for a semester summary. The findings
 * panel is the point of the screen: it names the gaps an evaluator would raise
 * while there is still a semester left to close them, rather than leaving the
 * course team to discover them during the visit.
 */
export default function CourseFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CourseFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/course-offerings/${id}/course-file`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to load course file');
        const body = await res.json();
        if (!cancelled) setData(body.data);
      } catch {
        if (!cancelled) {
          setFailed(true);
          toast.error('Could not build the course file');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const downloadCsv = () => {
    if (!data) return;
    const lines: string[] = [
      `Course File,${data.courseOffering.courseCode} ${data.courseOffering.courseName}`,
      `Semester,${data.courseOffering.semester}`,
      `Generated,${new Date(data.generatedAt).toLocaleString()}`,
      '',
    ];
    for (const s of data.sections) {
      lines.push(s.heading);
      lines.push(s.columns.join(','));
      for (const row of s.rows) {
        lines.push(
          row
            .map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
            .join(',')
        );
      }
      lines.push('');
    }
    if (data.findings.length) {
      lines.push('Findings to address before an accreditation visit');
      data.findings.forEach((f) => lines.push(`"${f.replace(/"/g, '""')}"`));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-file-${data.courseOffering.courseCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  /**
   * PDF is what a Programme Evaluator is handed. CSV is for a colleague who
   * wants to work on the numbers; nobody submits a spreadsheet to a panel.
   */
  const downloadPdf = async () => {
    if (!data) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape' });
      const co = data.courseOffering;

      doc.setFontSize(16);
      doc.text(`Course File — ${co.courseCode}`, 14, 16);
      doc.setFontSize(10);
      doc.text(
        [
          co.courseName,
          co.semester,
          co.creditHours ? `${co.creditHours} credit hours` : '',
          `Generated ${new Date(data.generatedAt).toLocaleDateString()}`,
        ]
          .filter(Boolean)
          .join('   |   '),
        14,
        23
      );

      let y = 31;

      // Findings lead the document. An evaluator reads them first, and so
      // should the course team — burying them after eight tables is how they
      // go unaddressed until the visit.
      if (data.findings.length) {
        autoTable(doc, {
          startY: y,
          head: [['Findings to address before an accreditation visit']],
          body: data.findings.map((f) => [f]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: PDF_WARN },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      }

      for (const section of data.sections) {
        autoTable(doc, {
          startY: y,
          head: [[section.heading]],
          body: [],
          styles: { fontSize: 9 },
          headStyles: { fillColor: PDF_ACCENT },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

        if (section.rows.length === 0) {
          autoTable(doc, {
            startY: y,
            body: [['Nothing recorded.']],
            styles: { fontSize: 8, textColor: 120 },
          });
        } else {
          autoTable(doc, {
            startY: y,
            head: [section.columns],
            body: section.rows.map((r) => r.map((c) => String(c ?? '—'))),
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: PDF_ACCENT },
          });
        }
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      }

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `${co.courseCode} Course File — ${PRODUCT_NAME} — page ${i} of ${pages}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
      }

      doc.save(`course-file-${co.courseCode}.pdf`);
      toast.success('Course file exported');
    } catch {
      toast.error('Could not generate the PDF');
    }
  };

  if (loading) return <PageLoading message="Assembling course file..." fullScreen={false} />;
  if (failed || !data) return <PageError message="Could not build the course file" fullScreen={false} />;

  const { courseOffering: co } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${co.courseCode} — Course File`}
        subtitle={`${co.courseName} · ${co.semester}${co.creditHours ? ` · ${co.creditHours} credit hours` : ''}`}
        action={
          <div className="flex gap-2">
            <Button onClick={downloadCsv} size="sm" variant="outline">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </Button>
            <Button onClick={downloadPdf} size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              PDF
            </Button>
          </div>
        }
      />

      {data.findings.length > 0 && (
        <div className="rounded-lg border border-warn/40 bg-warn-wash p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warn" />
            <h2 className="text-sm font-semibold text-warn">
              {data.findings.length} finding{data.findings.length === 1 ? '' : 's'} an evaluator would raise
            </h2>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc marker:text-warn">
            {data.findings.map((f) => (
              <li key={f} className="text-sm text-ink-2">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.sections.map((section) => (
        <div
          key={section.heading}
          className="rounded-lg border border-subtle bg-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-subtle">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-ink-muted" />
              {section.heading}
            </h2>
            {section.note && (
              <p className="text-xs text-ink-muted mt-1">{section.note}</p>
            )}
          </div>

          {section.rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted text-center">
              Nothing recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {section.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-ink-muted">
        Generated {new Date(data.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
