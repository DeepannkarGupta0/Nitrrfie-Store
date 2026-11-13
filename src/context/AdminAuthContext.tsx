import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSafeClerkAuth } from './SafeClerkContext';
import { AdminUser, StaffMember } from '../types/store';
import {
  getPermissionsForRole,
  getRoleTitleForRole,
  normalizeAdminRole,
} from '../config/clerk';
import {
  apiAddStaffMember,
  apiFetchAdminMe,
  apiRemoveStaffMember,
  apiUpdateStaffRole,
} from '../api/client';
import type { AdminAuthResult } from '../api/types';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoaded: boolean;
  isCheckingAuth: boolean;
  isStaffAuthorized: boolean;
  adminUser: AdminUser | null;
  staffRoster: StaffMember[];
  setStaffRosterFromServer: (roster: StaffMember[]) => void;
  addStaffMember: (
    email: string,
    role?: AdminUser['role']
  ) => Promise<{ success: boolean; error?: string }>;
  updateStaffRole: (
    email: string,
    role: AdminUser['role']
  ) => Promise<{ success: boolean; error?: string }>;
  removeStaffMember: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshAdminAuth: () => Promise<void>;
  openSignIn: () => void;
  openSignUp: () => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isLoaded: clerkLoaded,
    isSignedIn,
    user,
    getToken,
    openSignIn: clerkOpenSignIn,
    openSignUp: clerkOpenSignUp,
    signOut,
  } = useSafeClerkAuth();

  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [serverIdentity, setServerIdentity] = useState<AdminAuthResult['identity'] | null>(null);
  const [serverAuthorized, setServerAuthorized] = useState<boolean | null>(null);
  const [staffRoster, setStaffRoster] = useState<StaffMember[]>([]);

  // Purge any legacy client-side staff whitelist cache on mount
  useEffect(() => {
    try {
      localStorage.removeItem('nitrr_custom_staff_whitelist_v1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const userEmail = useMemo(() => {
    return user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || '';
  }, [user]);

  const refreshAdminAuth = useCallback(async () => {
    if (!clerkLoaded) return;

    if (!isSignedIn || !user || !userEmail) {
      setServerAuthorized(false);
      setServerIdentity(null);
      setStaffRoster([]);
      setIsCheckingAuth(false);
      return;
    }

    setIsCheckingAuth(true);
    try {
      const token = await getToken();
      if (!token) {
        setServerAuthorized(false);
        setServerIdentity(null);
        setStaffRoster([]);
        return;
      }

      const res = await apiFetchAdminMe(token, userEmail);
      if (res.success && res.authorized) {
        setServerAuthorized(true);
        setServerIdentity(res.identity || null);
      } else {
        setServerAuthorized(false);
        setServerIdentity(null);
        setStaffRoster([]);
      }
    } catch {
      setServerAuthorized(false);
      setServerIdentity(null);
      setStaffRoster([]);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [clerkLoaded, isSignedIn, user, userEmail, getToken]);

  useEffect(() => {
    void refreshAdminAuth();
  }, [refreshAdminAuth]);

  const isStaffAuthorized = useMemo(() => {
    if (!isSignedIn || !user) return false;
    return serverAuthorized === true;
  }, [isSignedIn, user, serverAuthorized]);

  const adminUser = useMemo<AdminUser | null>(() => {
    if (!isSignedIn || !user || !isStaffAuthorized || !serverIdentity) return null;

    const email = serverIdentity.email || user.primaryEmailAddress?.emailAddress || '';
    const name =
      user.fullName ||
      (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
      user.username ||
      email.split('@')[0] ||
      'Authorized Staff';

    const role = normalizeAdminRole(serverIdentity.role);
    const roleTitle = serverIdentity.roleTitle || getRoleTitleForRole(role);
    const department =
      (user.publicMetadata?.department as string) || 'NITRRFIE Operations & Logistics Desk';
    const permissions = serverIdentity.permissions || getPermissionsForRole(role);

    return {
      id: user.id,
      name,
      email,
      role,
      roleTitle,
      department,
      avatar: user.imageUrl,
      token: `clerk_${user.id}`,
      lastLogin: new Date().toISOString(),
      permissions,
    };
  }, [isSignedIn, user, isStaffAuthorized, serverIdentity]);

  const setStaffRosterFromServer = useCallback((roster: StaffMember[]) => {
    setStaffRoster(Array.isArray(roster) ? roster : []);
  }, []);

  const addStaffMember = useCallback(
    async (
      email: string,
      role: AdminUser['role'] = 'operations_lead'
    ): Promise<{ success: boolean; error?: string }> => {
      const cleaned = email.toLowerCase().trim();
      if (!cleaned || !cleaned.includes('@')) {
        return { success: false, error: 'Please enter a valid institutional email address.' };
      }

      const token = await getToken();
      if (!token || !userEmail) {
        return { success: false, error: 'Your administrative session has expired. Please re-authenticate.' };
      }

      const res = await apiAddStaffMember(cleaned, role, token, userEmail);
      if (!res.success || !res.staff) {
        return { success: false, error: res.error || 'Failed to add staff member.' };
      }

      setStaffRoster((prev) => {
        const filtered = prev.filter((m) => m.email.toLowerCase() !== res.staff!.email.toLowerCase());
        return [...filtered, res.staff!];
      });
      return { success: true };
    },
    [getToken, userEmail]
  );

  const updateStaffRole = useCallback(
    async (
      email: string,
      role: AdminUser['role']
    ): Promise<{ success: boolean; error?: string }> => {
      const token = await getToken();
      if (!token || !userEmail) {
        return { success: false, error: 'Your administrative session has expired.' };
      }

      const res = await apiUpdateStaffRole(email, role, token, userEmail);
      if (!res.success || !res.staff) {
        return { success: false, error: res.error || 'Failed to update staff role.' };
      }

      setStaffRoster((prev) =>
        prev.map((m) => (m.email.toLowerCase() === res.staff!.email.toLowerCase() ? res.staff! : m))
      );
      if (res.staff.email.toLowerCase() === userEmail) {
        void refreshAdminAuth();
      }
      return { success: true };
    },
    [getToken, userEmail, refreshAdminAuth]
  );

  const removeStaffMember = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      const token = await getToken();
      if (!token || !userEmail) {
        return { success: false, error: 'Your administrative session has expired.' };
      }

      const res = await apiRemoveStaffMember(email, token, userEmail);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to remove staff member.' };
      }

      const target = (res.removedEmail || email).toLowerCase().trim();
      setStaffRoster((prev) => prev.filter((m) => m.email.toLowerCase() !== target));
      return { success: true };
    },
    [getToken, userEmail]
  );

  const handleOpenSignIn = () => {
    try {
      clerkOpenSignIn();
    } catch (err) {
      console.warn('Clerk modal trigger:', err);
    }
  };

  const handleOpenSignUp = () => {
    try {
      clerkOpenSignUp();
    } catch (err) {
      console.warn('Clerk modal trigger:', err);
    }
  };

  const handleLogout = () => {
    try {
      setServerAuthorized(false);
      setServerIdentity(null);
      setStaffRoster([]);
      void signOut();
    } catch (err) {
      console.warn('Sign out:', err);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: isStaffAuthorized,
        isLoaded: clerkLoaded,
        isCheckingAuth,
        isStaffAuthorized,
        adminUser,
        staffRoster,
        setStaffRosterFromServer,
        addStaffMember,
        updateStaffRole,
        removeStaffMember,
        refreshAdminAuth,
        openSignIn: handleOpenSignIn,
        openSignUp: handleOpenSignUp,
        logout: handleLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
