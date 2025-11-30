import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook to get department ID from authenticated user
 * Uses token data directly - no API call needed
 * Returns departmentId if available, null otherwise
 */
export function useDepartmentId() {
  const { user, loading } = useAuth();
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      // Get departmentId from user object (direct from token) or userData
      const deptId = user.departmentId || user.userData?.departmentId;
      if (deptId) {
        setDepartmentId(deptId.toString());
      } else {
        setDepartmentId(null);
      }
    }
  }, [user, loading]);

  return {
    departmentId,
    loading,
    hasDepartment: !!departmentId,
  };
}


