import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerOnboardingRoutes } from '@/features/onboarding/backend/route';
import { registerCoursesRoutes } from '@/features/courses/backend/route';
import { registerEnrollmentsRoutes } from '@/features/enrollments/backend/route';
import { registerDashboardRoutes } from '@/features/dashboard/backend/route';
import { registerAssignmentsRoutes } from '@/features/assignments/backend/route';
import { registerGradesRoutes } from '@/features/grades/backend/route';
import { registerInstructorDashboardRoutes } from '@/features/instructor-dashboard/backend/route';
import { registerCategoriesRoutes } from '@/features/categories/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerOnboardingRoutes(app);
  registerCoursesRoutes(app);
  registerEnrollmentsRoutes(app);
  registerDashboardRoutes(app);
  registerAssignmentsRoutes(app);
  registerGradesRoutes(app);
  registerInstructorDashboardRoutes(app);
  registerCategoriesRoutes(app);

  singletonApp = app;

  return app;
};
