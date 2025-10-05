import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  type GradesResponse,
  type CourseGrade,
  type AssignmentGrade,
  type GradeSummary,
  GradesResponseSchema,
  CourseGradeSchema,
  // 채점 이력 관련 스키마 추가
  type GradeLog,
  type GradeLogsResponse,
  type CreateGradeLogRequest,
  type GradeLogTableRow,
  GradeLogSchema,
  CreateGradeLogRequestSchema,
} from './schema';
import {
  gradesErrorCodes,
  type GradesServiceError,
} from './error';

/**
 * 사용자의 모든 성적 조회 서비스
 */
export const getUserGrades = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<GradesResponse, GradesServiceError, unknown>> => {
  try {
    // 1. 사용자 역할 확인 (Learner만 허용)
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return failure(404, gradesErrorCodes.userNotFound, '사용자를 찾을 수 없습니다.');
    }

    if (user.role !== 'learner') {
      return failure(403, gradesErrorCodes.invalidRole, 'Learner 권한이 필요합니다.');
    }

    // 2. 수강 중인 코스 목록 조회
    const { data: enrollments, error: enrollmentError } = await client
      .from('enrollments')
      .select(`
        course_id,
        courses!inner(
          id,
          title,
          description
        )
      `)
      .eq('learner_id', userId)
      .eq('is_active', true)
      .eq('courses.status', 'published');

    if (enrollmentError) {
      return failure(500, gradesErrorCodes.fetchError, '수강 중인 코스 조회에 실패했습니다.', enrollmentError);
    }

    if (!enrollments || enrollments.length === 0) {
      // 수강 중인 코스가 없는 경우 빈 데이터 반환
      const emptyResponse: GradesResponse = {
        courses: [],
        summary: {
          totalCourses: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          overallProgress: 0,
          averageScore: 0,
          totalScore: 0,
        },
      };
      return success(emptyResponse);
    }

    // 3. 각 코스별 성적 정보 조회
    const courseGrades: CourseGrade[] = [];
    let totalAssignments = 0;
    let totalCompletedAssignments = 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const enrollment of enrollments) {
      const course = enrollment.courses as any;
      if (!course) continue;

      const courseGradeResult = await getCourseGrades(client, userId, course.id);
      if (courseGradeResult.ok) {
        const courseGrade = courseGradeResult.data;
        courseGrades.push(courseGrade);
        
        totalAssignments += courseGrade.totalAssignments;
        totalCompletedAssignments += courseGrade.completedAssignments;
        
        // 가중 평균을 위한 점수 계산
        courseGrade.assignments.forEach(assignment => {
          if (assignment.status === 'graded' && assignment.score !== null) {
            totalWeightedScore += assignment.score * assignment.scoreWeight;
            totalWeight += assignment.scoreWeight;
          }
        });
      }
    }

    // 4. 전체 요약 정보 계산
    const summary: GradeSummary = {
      totalCourses: courseGrades.length,
      totalAssignments,
      completedAssignments: totalCompletedAssignments,
      overallProgress: totalAssignments > 0 ? Math.round((totalCompletedAssignments / totalAssignments) * 100 * 10) / 10 : 0,
      averageScore: totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 0,
      totalScore: totalWeightedScore,
    };

    const gradesResponse: GradesResponse = {
      courses: courseGrades,
      summary,
    };

    return success(gradesResponse);

  } catch (error) {
    return failure(500, gradesErrorCodes.databaseError, '성적 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 특정 코스의 성적 조회 서비스
 */
export const getCourseGrades = async (
  client: SupabaseClient,
  userId: string,
  courseId: string
): Promise<HandlerResult<CourseGrade, GradesServiceError, unknown>> => {
  try {
    // 1. 사용자의 해당 코스 수강 여부 확인
    const { data: enrollment, error: enrollmentError } = await client
      .from('enrollments')
      .select(`
        id,
        courses!inner(
          id,
          title,
          description,
          status
        )
      `)
      .eq('learner_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (enrollmentError || !enrollment) {
      return failure(403, gradesErrorCodes.notEnrolled, '수강 중인 코스가 아닙니다.');
    }

    const course = enrollment.courses as any;
    if (!course || course.status !== 'published') {
      return failure(404, gradesErrorCodes.courseNotFound, '코스를 찾을 수 없습니다.');
    }

    // 2. 해당 코스의 published 과제 목록 조회
    const { data: assignments, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        score_weight,
        allow_late_submission,
        allow_resubmission,
        status
      `)
      .eq('course_id', courseId)
      .eq('status', 'published')
      .order('due_date', { ascending: true });

    if (assignmentError) {
      return failure(500, gradesErrorCodes.fetchError, '과제 정보 조회에 실패했습니다.', assignmentError);
    }

    if (!assignments || assignments.length === 0) {
      // 과제가 없는 경우 빈 데이터 반환
      const emptyCourseGrade: CourseGrade = {
        courseId: course.id,
        courseTitle: course.title,
        courseDescription: course.description,
        assignments: [],
        totalScore: 0,
        averageScore: 0,
        progress: 0,
        totalAssignments: 0,
        completedAssignments: 0,
      };
      return success(emptyCourseGrade);
    }

    // 3. 각 과제별 제출물 및 채점 정보 조회
    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions, error: submissionError } = await client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        content,
        link_url,
        is_late,
        status,
        score,
        feedback,
        graded_at,
        submitted_at
      `)
      .eq('learner_id', userId)
      .in('assignment_id', assignmentIds);

    if (submissionError) {
      return failure(500, gradesErrorCodes.fetchError, '제출물 정보 조회에 실패했습니다.', submissionError);
    }

    // 4. 과제별 성적 정보 구성
    const submissionMap = new Map(
      (submissions || []).map(s => [s.assignment_id, s])
    );

    const assignmentGrades: AssignmentGrade[] = assignments.map(assignment => {
      const submission = submissionMap.get(assignment.id);
      
      let status: AssignmentGrade['status'] = 'not_submitted';
      if (submission) {
        status = submission.status as AssignmentGrade['status'];
      }

      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.due_date,
        scoreWeight: assignment.score_weight,
        status,
        score: submission?.score || null,
        feedback: submission?.feedback || null,
        isLate: submission?.is_late || false,
        submittedAt: submission?.submitted_at || null,
        canResubmit: assignment.allow_resubmission,
      };
    });

    // 5. 코스 성적 요약 계산
    const completedAssignments = assignmentGrades.filter(a => a.status === 'graded').length;
    const totalAssignments = assignmentGrades.length;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    assignmentGrades.forEach(assignment => {
      if (assignment.status === 'graded' && assignment.score !== null) {
        totalWeightedScore += assignment.score * assignment.scoreWeight;
        totalWeight += assignment.scoreWeight;
      }
    });

    const averageScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 0;
    const progress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100 * 10) / 10 : 0;

    const courseGrade: CourseGrade = {
      courseId: course.id,
      courseTitle: course.title,
      courseDescription: course.description,
      assignments: assignmentGrades,
      totalScore: totalWeightedScore,
      averageScore,
      progress,
      totalAssignments,
      completedAssignments,
    };

    return success(courseGrade);

  } catch (error) {
    return failure(500, gradesErrorCodes.databaseError, '코스 성적 조회 중 오류가 발생했습니다.', error);
  }
};

// ===== 채점 이력 관련 서비스 =====

/**
 * 채점 이력 생성 서비스
 * 채점 활동에 대한 감사 추적을 위한 로그 생성
 */
export const createGradeLog = async (
  client: SupabaseClient,
  data: CreateGradeLogRequest
): Promise<HandlerResult<GradeLog, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = CreateGradeLogRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, gradesErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    const { submissionId, graderId, action, score, feedback } = parsedData.data;

    // 2. 제출물 존재 여부 확인
    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .select('id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData) {
      return failure(404, gradesErrorCodes.submissionNotFound, '제출물을 찾을 수 없습니다.');
    }

    // 3. 채점자 존재 여부 확인
    const { data: graderData, error: graderError } = await client
      .from('users')
      .select('id, full_name, role')
      .eq('id', graderId)
      .single();

    if (graderError || !graderData) {
      return failure(404, gradesErrorCodes.userNotFound, '채점자를 찾을 수 없습니다.');
    }

    if (graderData.role !== 'instructor') {
      return failure(403, gradesErrorCodes.invalidRole, '강사만 채점할 수 있습니다.');
    }

    // 4. 채점 이력 생성
    const now = new Date().toISOString();
    const { data: logData, error: logError } = await client
      .from('grade_logs')
      .insert({
        submission_id: submissionId,
        grader_id: graderId,
        action,
        score,
        feedback,
        created_at: now,
      })
      .select()
      .single();

    if (logError || !logData) {
      return failure(500, gradesErrorCodes.databaseError, '채점 이력 생성 중 오류가 발생했습니다.');
    }

    // 5. 응답 데이터 구성
    const response: GradeLog = {
      id: logData.id,
      submissionId: logData.submission_id,
      graderId: logData.grader_id,
      graderName: graderData.full_name,
      action: logData.action as 'grade' | 'request_resubmission',
      score: logData.score,
      feedback: logData.feedback,
      createdAt: logData.created_at,
    };

    return success(response);

  } catch (error) {
    return failure(500, gradesErrorCodes.databaseError, '채점 이력 생성 중 오류가 발생했습니다.', error);
  }
};

/**
 * 채점 이력 조회 서비스
 * 특정 제출물의 채점 이력을 시간순으로 조회
 */
export const getGradingHistory = async (
  client: SupabaseClient,
  submissionId: string,
  params: {
    page?: number;
    limit?: number;
  } = {}
): Promise<HandlerResult<GradeLogsResponse, string, unknown>> => {
  try {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // 1. 제출물 존재 여부 확인
    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .select('id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData) {
      return failure(404, gradesErrorCodes.submissionNotFound, '제출물을 찾을 수 없습니다.');
    }

    // 2. 채점 이력 조회
    const { data: logsData, error: logsError, count } = await client
      .from('grade_logs')
      .select(`
        id,
        submission_id,
        grader_id,
        action,
        score,
        feedback,
        created_at,
        users!inner(
          id,
          full_name
        )
      `, { count: 'exact' })
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      return failure(500, gradesErrorCodes.databaseError, '채점 이력 조회 중 오류가 발생했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 3. 응답 데이터 구성
    const logs: GradeLog[] = (logsData || []).map(log => ({
      id: log.id,
      submissionId: log.submission_id,
      graderId: log.grader_id,
      graderName: (log.users as any).full_name,
      action: log.action as 'grade' | 'request_resubmission',
      score: log.score,
      feedback: log.feedback,
      createdAt: log.created_at,
    }));

    const response: GradeLogsResponse = {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return success(response);

  } catch (error) {
    return failure(500, gradesErrorCodes.databaseError, '채점 이력 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 강사별 채점 이력 조회 서비스
 * 특정 강사의 모든 채점 활동 이력을 조회
 */
export const getInstructorGradingHistory = async (
  client: SupabaseClient,
  instructorId: string,
  params: {
    courseId?: string;
    assignmentId?: string;
    action?: 'grade' | 'request_resubmission';
    page?: number;
    limit?: number;
  } = {}
): Promise<HandlerResult<GradeLogsResponse, string, unknown>> => {
  try {
    const { courseId, assignmentId, action, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // 1. 강사 권한 확인
    const { data: instructorData, error: instructorError } = await client
      .from('users')
      .select('id, role')
      .eq('id', instructorId)
      .single();

    if (instructorError || !instructorData) {
      return failure(404, gradesErrorCodes.userNotFound, '강사를 찾을 수 없습니다.');
    }

    if (instructorData.role !== 'instructor') {
      return failure(403, gradesErrorCodes.invalidRole, '강사 권한이 필요합니다.');
    }

    // 2. 쿼리 구성
    let query = client
      .from('grade_logs')
      .select(`
        id,
        submission_id,
        grader_id,
        action,
        score,
        feedback,
        created_at,
        users!inner(
          id,
          full_name
        ),
        submissions!inner(
          id,
          assignment_id,
          assignments!inner(
            id,
            title,
            course_id,
            courses!inner(
              id,
              title,
              instructor_id
            )
          )
        )
      `, { count: 'exact' })
      .eq('grader_id', instructorId);

    // 3. 필터 조건 적용
    if (courseId) {
      query = query.eq('submissions.assignments.course_id', courseId);
    }

    if (assignmentId) {
      query = query.eq('submissions.assignment_id', assignmentId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    // 4. 페이지네이션 적용
    const { data: logsData, error: logsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      return failure(500, gradesErrorCodes.databaseError, '채점 이력 조회 중 오류가 발생했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 5. 응답 데이터 구성
    const logs: GradeLog[] = (logsData || []).map(log => ({
      id: log.id,
      submissionId: log.submission_id,
      graderId: log.grader_id,
      graderName: (log.users as any).full_name,
      action: log.action as 'grade' | 'request_resubmission',
      score: log.score,
      feedback: log.feedback,
      createdAt: log.created_at,
    }));

    const response: GradeLogsResponse = {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return success(response);

  } catch (error) {
    return failure(500, gradesErrorCodes.databaseError, '강사 채점 이력 조회 중 오류가 발생했습니다.', error);
  }
};
