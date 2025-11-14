'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { transcript_type, transcript_status } from '@prisma/client';

interface Transcript {
  id: number;
  student: {
    id: number;
    rollNumber: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    program: {
      id: number;
      name: string;
      code: string;
    };
    department: {
      id: number;
      name: string;
      code: string;
    };
  };
  semester: {
    id: number;
    name: string;
  } | null;
  transcriptType: transcript_type;
  totalCGPA: number | null;
  totalCreditHours: number | null;
  isOfficial: boolean;
  status: transcript_status;
  generatedAt: string;
  filePath: string | null;
  generator: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function TranscriptViewPage() {
  const router = useRouter();
  const params = useParams();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTranscript();
    }
  }, [params.id]);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transcripts/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }
      const data = await response.json();
      if (data.success) {
        setTranscript(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch transcript');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      toast.error('Failed to load transcript');
      router.push('/admin/transcripts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/transcripts/${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete transcript');
      }

      toast.success('Transcript deleted successfully');
      router.push('/admin/transcripts');
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete transcript'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: transcript_status) => {
    switch (status) {
      case 'generated':
        return <Badge variant="default">Generated</Badge>;
      case 'issued':
        return <Badge variant="default">Issued</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTranscriptTypeLabel = (type: transcript_type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Transcript not found</p>
          <Button onClick={() => router.push('/admin/transcripts')} className="mt-4">
            Back to Transcripts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/transcripts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Academic Transcript</h1>
            <p className="text-muted-foreground">
              {transcript.student.user.first_name}{' '}
              {transcript.student.user.last_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {transcript.filePath && (
            <Button
              variant="outline"
              onClick={() => window.open(transcript.filePath || '', '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/students/${transcript.student.id}`)
            }
          >
            View Student
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-medium">
                {transcript.student.user.first_name}{' '}
                {transcript.student.user.last_name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="text-lg font-medium">{transcript.student.rollNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg">{transcript.student.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="text-lg font-medium">
                  {transcript.student.program.code} -{' '}
                  {transcript.student.program.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-lg font-medium">
                  {transcript.student.department.code} -{' '}
                  {transcript.student.department.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcript Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-lg font-medium">
                  {getTranscriptTypeLabel(transcript.transcriptType)}
                  {transcript.isOfficial && (
                    <Badge variant="outline" className="ml-2">
                      Official
                    </Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(transcript.status)}</div>
              </div>
              {transcript.semester && (
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="text-lg font-medium">
                    {transcript.semester.name}
                  </p>
                </div>
              )}
              {transcript.totalCGPA !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">CGPA</p>
                  <p className="text-lg font-medium">
                    {transcript.totalCGPA.toFixed(2)}
                  </p>
                </div>
              )}
              {transcript.totalCreditHours !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Credit Hours</p>
                  <p className="text-lg font-medium">
                    {transcript.totalCreditHours}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Generated By</p>
              <p className="text-lg font-medium">
                {transcript.generator.first_name} {transcript.generator.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {transcript.generator.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Generated At</p>
              <p className="text-lg">
                {format(new Date(transcript.generatedAt), 'PPP p')}
              </p>
            </div>
            {transcript.filePath && (
              <div>
                <p className="text-sm text-muted-foreground">File Path</p>
                <p className="text-lg font-mono text-sm break-all">
                  {transcript.filePath}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transcript</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transcript? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

