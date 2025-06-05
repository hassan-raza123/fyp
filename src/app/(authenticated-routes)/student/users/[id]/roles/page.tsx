'use client';

import { useParams } from 'next/navigation';
import RoleManagementForm from '@/components/users/RoleManagementForm';

export default function AssignRolesPage() {
  const params = useParams();
  const userId = params?.id as string;

  return <RoleManagementForm userId={userId} mode='assign' />;
}
