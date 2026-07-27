'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Forced password change.
 *
 * Accounts created by an admin or bulk import start with a randomly generated
 * temporary password. The proxy holds them here until they choose their own,
 * so an admin-issued credential is never a long-lived one.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const rules = [
    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
    { label: 'An uppercase letter', ok: /[A-Z]/.test(newPassword) },
    { label: 'A lowercase letter', ok: /[a-z]/.test(newPassword) },
    { label: 'A number', ok: /[0-9]/.test(newPassword) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (newPassword !== confirmPassword) {
      setErrors(['The two passwords do not match']);
      return;
    }

    const unmet = rules.filter((r) => !r.ok);
    if (unmet.length > 0) {
      setErrors(unmet.map((r) => `Password needs: ${r.label.toLowerCase()}`));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors(data.errors ?? [data.error ?? 'Failed to change password']);
        return;
      }

      toast.success('Password changed successfully');
      router.push(data.data?.redirectTo ?? '/');
      router.refresh();
    } catch {
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
            <CardTitle>Choose a new password</CardTitle>
          </div>
          <CardDescription>
            Your account is using a temporary password issued by an
            administrator. Set your own password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Temporary password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <ul className="space-y-1 pt-1">
                {rules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`text-xs ${
                      rule.ok ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}
                  >
                    {rule.ok ? '✓' : '○'} {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {errors.length > 0 && (
              <ul className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">
                    {err}
                  </li>
                ))}
              </ul>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Change password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
