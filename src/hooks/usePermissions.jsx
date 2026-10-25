import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPermissions } from '../lib/api';

const PermissionsContext = createContext({});

export function PermissionsProvider({ children }) {
  const { userRole } = useAuth();
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchPermissions().then(setPermissions).catch(() => setPermissions(null));
  }, []);

  const canAccess = (feature) => {
    if (!permissions || !userRole) return true; // Default allow if not loaded
    if (userRole === 'admin' || userRole === 'owner') return true;
    return permissions[userRole]?.[feature] ?? false;
  };

  const reload = () => fetchPermissions().then(setPermissions);

  return (
    <PermissionsContext.Provider value={{ permissions, canAccess, reload }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
