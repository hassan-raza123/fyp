'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUp, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Evidence files for one assessment.
 *
 * A PEC course file is expected to carry the question paper and samples of
 * marked student work — conventionally the strongest, an average and the
 * weakest script. This is the only place in the product that stores a file, so
 * without it the course file has a permanent hole in it.
 */

const KINDS = [
  { value: 'question_paper', label: 'Question paper' },
  { value: 'marked_script', label: 'Marked script (sample)' },
  { value: 'rubric_document', label: 'Rubric document' },
  { value: 'supporting_document', label: 'Supporting document' },
];

interface Attachment {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  label: string | null;
  createdAt: string;
  uploader: { first_name: string; last_name: string };
}

const humanSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function AssessmentAttachments({ assessmentId }: { assessmentId: number }) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState('question_paper');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/attachments`, {
        credentials: 'include',
      });
      if (res.ok) {
        const body = await res.json();
        setFiles(body.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);

      const res = await fetch(`/api/assessments/${assessmentId}/attachments`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Upload failed');

      toast.success(`${file.name} attached`);
      await load();
    } catch (e: unknown) {
      // The server's message names the actual reason — wrong type, too large,
      // storage not configured — so surface it rather than a generic failure.
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-subtle bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-subtle flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5 text-ink-muted" />
            Evidence files ({files.length})
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Question paper and sample marked scripts, for the course file.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="h-8 w-[190px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <FileUp className="w-3.5 h-3.5 mr-1.5" />
            {uploading ? 'Uploading…' : 'Attach'}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="px-4 py-5 text-sm text-ink-muted text-center">Loading…</p>
      ) : files.length === 0 ? (
        <p className="px-4 py-5 text-sm text-ink-muted text-center">
          Nothing attached. A PEC course file is expected to include the question
          paper and the strongest, an average and the weakest marked script.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Kind</th>
                <th>Size</th>
                <th>Uploaded by</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td>{f.originalName}</td>
                  <td>{KINDS.find((k) => k.value === f.kind)?.label ?? f.kind}</td>
                  <td>{humanSize(f.sizeBytes)}</td>
                  <td>
                    {f.uploader.first_name} {f.uploader.last_name}
                  </td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
