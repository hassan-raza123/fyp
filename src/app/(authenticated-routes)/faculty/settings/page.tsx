'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Faculty Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your faculty account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Settings functionality coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

