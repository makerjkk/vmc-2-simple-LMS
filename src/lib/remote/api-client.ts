import axios, { isAxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

/**
 * 제출물 관련 API 함수들
 */

// 제출물 생성 요청 타입
export interface CreateSubmissionRequest {
  content: string;
  linkUrl?: string | null;
}

// 제출물 업데이트 요청 타입
export interface UpdateSubmissionRequest {
  content: string;
  linkUrl?: string | null;
}

// 제출물 응답 타입
export interface SubmissionResponse {
  id: string;
  assignmentId: string;
  content: string;
  linkUrl: string | null;
  isLate: boolean;
  status: 'submitted' | 'graded' | 'resubmission_required';
  submittedAt: string;
  canResubmit: boolean;
}

/**
 * 제출물 생성 API 호출
 */
export const createSubmission = async (
  assignmentId: string,
  data: CreateSubmissionRequest
): Promise<SubmissionResponse> => {
  try {
    const response = await apiClient.post(`/api/assignments/${assignmentId}/submissions`, data);
    return response.data.data;
  } catch (error) {
    const message = extractApiErrorMessage(error, '제출물 생성 중 오류가 발생했습니다.');
    throw new Error(message);
  }
};

/**
 * 제출물 업데이트 API 호출 (재제출)
 */
export const updateSubmission = async (
  assignmentId: string,
  data: UpdateSubmissionRequest
): Promise<SubmissionResponse> => {
  try {
    const response = await apiClient.put(`/api/assignments/${assignmentId}/submissions`, data);
    return response.data.data;
  } catch (error) {
    const message = extractApiErrorMessage(error, '제출물 업데이트 중 오류가 발생했습니다.');
    throw new Error(message);
  }
};

/**
 * 제출물 조회 API 호출
 */
export const getSubmission = async (
  assignmentId: string
): Promise<SubmissionResponse | null> => {
  try {
    const response = await apiClient.get(`/api/assignments/${assignmentId}/submissions`);
    return response.data.data;
  } catch (error) {
    // 404는 제출물이 없는 경우이므로 null 반환
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    const message = extractApiErrorMessage(error, '제출물 조회 중 오류가 발생했습니다.');
    throw new Error(message);
  }
};

export { apiClient, isAxiosError };
