"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  CurrentUserContextValue,
  CurrentUserSnapshot,
} from "../types";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  children: ReactNode;
  initialState: CurrentUserSnapshot;
};

export const CurrentUserProvider = ({
  children,
  initialState,
}: CurrentUserProviderProps) => {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState<CurrentUserSnapshot>(initialState);

  const refresh = useCallback(async () => {
    setSnapshot((prev) => ({ status: "loading", user: prev.user }));
    const supabase = getSupabaseBrowserClient();

    try {
      const result = await supabase.auth.getUser();

      const nextSnapshot = await match(result)
        .with({ data: { user: P.nonNullable } }, async ({ data }) => {
          const baseUser = {
            id: data.user.id,
            email: data.user.email,
            appMetadata: data.user.app_metadata ?? {},
            userMetadata: data.user.user_metadata ?? {},
          };

          // 프로필 정보 조회
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('full_name, phone, role, terms_agreed_at')
              .eq('auth_user_id', data.user.id)
              .maybeSingle() as { data: any };

            if (profile && profile.full_name && profile.role) {
              return {
                status: "authenticated" as const,
                user: {
                  ...baseUser,
                  profile: {
                    fullName: profile.full_name,
                    phone: profile.phone,
                    role: profile.role as 'learner' | 'instructor' | 'operator',
                    termsAgreedAt: profile.terms_agreed_at,
                  },
                },
              };
            }
          } catch (error) {
            console.error('Failed to load user profile:', error);
          }

          return {
            status: "authenticated" as const,
            user: baseUser,
          };
        })
        .otherwise(() => Promise.resolve({ status: "unauthenticated" as const, user: null }));

      setSnapshot(nextSnapshot);
      queryClient.setQueryData(["currentUser"], nextSnapshot);
    } catch (error) {
      const fallbackSnapshot: CurrentUserSnapshot = {
        status: "unauthenticated",
        user: null,
      };
      setSnapshot(fallbackSnapshot);
      queryClient.setQueryData(["currentUser"], fallbackSnapshot);
    }
  }, [queryClient]);

  const value = useMemo<CurrentUserContextValue>(() => {
    return {
      ...snapshot,
      refresh,
      isAuthenticated: snapshot.status === "authenticated",
      isLoading: snapshot.status === "loading",
    };
  }, [refresh, snapshot]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserContext = () => {
  const value = useContext(CurrentUserContext);

  if (!value) {
    throw new Error("CurrentUserProvider가 트리 상단에 필요합니다.");
  }

  return value;
};
