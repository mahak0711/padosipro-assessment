import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileApi } from '../api/profile';
import { tasksApi } from '../api/tasks';
import { ApiError } from '../api/client';

const TOKEN_KEY = 'padosipro_token';

export type AppStatus = 'loading' | 'signed-out' | 'needs-profile' | 'needs-tasks' | 'ready';

interface AuthContextValue {
  status: AppStatus;
  token: string | null;
  signIn: (token: string, profileComplete: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AppStatus>('loading');
  const [token, setToken] = useState<string | null>(null);

  const evaluateStatus = useCallback(async (activeToken: string) => {
    try {
      const profile = await profileApi.get(activeToken);
      if (!profile.profileComplete) {
        setStatus('needs-profile');
        return;
      }
      const selected = await tasksApi.selected(activeToken);
      setStatus(selected.tasks.length > 0 ? 'ready' : 'needs-tasks');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setStatus('signed-out');
        return;
      }
      // Network or server error while bootstrapping: keep the user signed in
      // locally and let the relevant screen surface a retryable error state.
      setStatus('ready');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setStatus('signed-out');
        return;
      }
      setToken(stored);
      await evaluateStatus(stored);
    })();
  }, [evaluateStatus]);

  const signIn = useCallback(
    async (newToken: string, profileComplete: boolean) => {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      if (!profileComplete) {
        setStatus('needs-profile');
      } else {
        await evaluateStatus(newToken);
      }
    },
    [evaluateStatus]
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setStatus('signed-out');
  }, []);

  const refreshStatus = useCallback(async () => {
    if (token) {
      await evaluateStatus(token);
    }
  }, [token, evaluateStatus]);

  const value = useMemo(
    () => ({ status, token, signIn, signOut, refreshStatus }),
    [status, token, signIn, signOut, refreshStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
