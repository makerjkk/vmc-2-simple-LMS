import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot, CurrentUser } from "../types";

const mapUser = async (user: User, supabase: any): Promise<CurrentUser> => {
  const baseUser = {
    id: user.id,
    email: user.email,
    appMetadata: user.app_metadata ?? {},
    userMetadata: user.user_metadata ?? {},
  };

  // 프로필 정보 조회
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, phone, role, terms_agreed_at')
      .eq('auth_user_id', user.id)
      .maybeSingle() as { data: any };

    if (profile && profile.full_name && profile.role) {
      return {
        ...baseUser,
        profile: {
          fullName: profile.full_name,
          phone: profile.phone,
          role: profile.role as 'learner' | 'instructor' | 'operator',
          termsAgreedAt: profile.terms_agreed_at,
        },
      };
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
  }

  return baseUser;
};

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();
  const user = result.data.user;

  if (user) {
    const mappedUser = await mapUser(user, supabase);
    return {
      status: "authenticated",
      user: mappedUser,
    };
  }

  return { status: "unauthenticated", user: null };
};
