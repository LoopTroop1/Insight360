'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Department {
  id: number;
  name: string;
  level: string;
  parentDepartmentId: number | null;
  ministryId: number | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  personaType: string; // "officer", "teamlead", "secretary", "auditor", "hr", "reform"
  departmentId: number | null;
  designation: string;
  joinedDate: string;
  avatarUrl: string | null;
  department: Department | null;
}

interface SessionContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  switchUser: (id: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
        
        // Retrieve last active user from localStorage or default to first user (Secretary, Rajiv Gauba)
        const storedUserId = localStorage.getItem('eoffice_active_userid');
        let selectedUser = null;
        
        if (storedUserId) {
          selectedUser = data.find((u: User) => u.id === parseInt(storedUserId));
        }
        
        if (!selectedUser && data.length > 0) {
          // Default to Rajiv Gauba (Secretary)
          selectedUser = data.find((u: User) => u.personaType === 'secretary') || data[0];
        }
        
        setCurrentUser(selectedUser || null);
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const switchUser = (id: number) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('eoffice_active_userid', id.toString());
      // Only reload if switching persona on a dashboard page
      if (window.location.pathname !== '/') {
        window.location.reload();
      }
    }
  };

  return (
    <SessionContext.Provider value={{ currentUser, users, loading, switchUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
