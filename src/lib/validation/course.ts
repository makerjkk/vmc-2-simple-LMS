/**
 * 코스 관련 공통 검증 로직
 * 클라이언트와 서버에서 공통으로 사용되는 검증 함수들
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 코스 제목 검증
 */
export const validateCourseTitle = (title: string): ValidationResult => {
  if (!title.trim()) {
    return { isValid: false, message: '코스 제목을 입력해주세요.' };
  }
  
  if (title.length < 3) {
    return { isValid: false, message: '코스 제목은 3자 이상이어야 합니다.' };
  }
  
  if (title.length > 200) {
    return { isValid: false, message: '코스 제목은 200자를 초과할 수 없습니다.' };
  }
  
  // 특수문자 제한 체크
  const invalidChars = /[<>{}]/;
  if (invalidChars.test(title)) {
    return { isValid: false, message: '제목에 사용할 수 없는 문자가 포함되어 있습니다.' };
  }
  
  return { isValid: true };
};

/**
 * 코스 설명 검증
 */
export const validateCourseDescription = (description: string): ValidationResult => {
  if (!description.trim()) {
    return { isValid: false, message: '코스 설명을 입력해주세요.' };
  }
  
  if (description.length < 10) {
    return { isValid: false, message: '코스 설명은 10자 이상이어야 합니다.' };
  }
  
  if (description.length > 2000) {
    return { isValid: false, message: '코스 설명은 2000자를 초과할 수 없습니다.' };
  }
  
  return { isValid: true };
};

/**
 * 커리큘럼 검증
 */
export const validateCourseCurriculum = (curriculum?: string): ValidationResult => {
  if (!curriculum) {
    return { isValid: true }; // 선택 필드
  }
  
  if (curriculum.length > 5000) {
    return { isValid: false, message: '커리큘럼은 5000자를 초과할 수 없습니다.' };
  }
  
  return { isValid: true };
};

/**
 * 카테고리 ID 검증
 */
export const validateCategoryId = (categoryId: string): ValidationResult => {
  if (!categoryId) {
    return { isValid: false, message: '카테고리를 선택해주세요.' };
  }
  
  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(categoryId)) {
    return { isValid: false, message: '올바른 카테고리를 선택해주세요.' };
  }
  
  return { isValid: true };
};

/**
 * 난이도 검증
 */
export const validateCourseDifficulty = (difficulty: string): ValidationResult => {
  if (!difficulty) {
    return { isValid: false, message: '난이도를 선택해주세요.' };
  }
  
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(difficulty)) {
    return { isValid: false, message: '올바른 난이도를 선택해주세요.' };
  }
  
  return { isValid: true };
};

/**
 * 코스 상태 검증
 */
export const validateCourseStatus = (status: string): ValidationResult => {
  if (!status) {
    return { isValid: false, message: '코스 상태가 필요합니다.' };
  }
  
  const validStatuses = ['draft', 'published', 'archived'];
  if (!validStatuses.includes(status)) {
    return { isValid: false, message: '올바른 코스 상태가 아닙니다.' };
  }
  
  return { isValid: true };
};

/**
 * 코스 데이터 전체 검증
 */
export const validateCourseData = (data: {
  title: string;
  description: string;
  curriculum?: string;
  categoryId: string;
  difficulty: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // 각 필드 검증
  const titleValidation = validateCourseTitle(data.title);
  if (!titleValidation.isValid && titleValidation.message) {
    errors.title = titleValidation.message;
  }
  
  const descriptionValidation = validateCourseDescription(data.description);
  if (!descriptionValidation.isValid && descriptionValidation.message) {
    errors.description = descriptionValidation.message;
  }
  
  const curriculumValidation = validateCourseCurriculum(data.curriculum);
  if (!curriculumValidation.isValid && curriculumValidation.message) {
    errors.curriculum = curriculumValidation.message;
  }
  
  const categoryValidation = validateCategoryId(data.categoryId);
  if (!categoryValidation.isValid && categoryValidation.message) {
    errors.categoryId = categoryValidation.message;
  }
  
  const difficultyValidation = validateCourseDifficulty(data.difficulty);
  if (!difficultyValidation.isValid && difficultyValidation.message) {
    errors.difficulty = difficultyValidation.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 게시 가능 여부 검증
 * draft 상태의 코스가 published로 전환 가능한지 확인
 */
export const validatePublishRequirements = (courseData: {
  title: string;
  description: string;
  categoryId: string;
  difficulty: string;
}): ValidationResult => {
  const validation = validateCourseData(courseData);
  
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    return { 
      isValid: false, 
      message: `게시하기 전에 다음 항목을 완성해주세요: ${firstError}` 
    };
  }
  
  return { isValid: true };
};

/**
 * 상태 전환 가능 여부 검증
 */
export const validateStatusTransition = (
  currentStatus: string,
  newStatus: string,
  hasEnrollments: boolean = false
): ValidationResult => {
  // 현재 상태와 동일한 상태로 전환 시도
  if (currentStatus === newStatus) {
    return { isValid: false, message: '이미 해당 상태입니다.' };
  }
  
  // 상태 검증
  const currentStatusValidation = validateCourseStatus(currentStatus);
  const newStatusValidation = validateCourseStatus(newStatus);
  
  if (!currentStatusValidation.isValid) {
    return { isValid: false, message: '현재 코스 상태가 올바르지 않습니다.' };
  }
  
  if (!newStatusValidation.isValid) {
    return { isValid: false, message: '변경하려는 상태가 올바르지 않습니다.' };
  }
  
  // 특정 전환 규칙 검증
  switch (`${currentStatus}->${newStatus}`) {
    case 'archived->draft':
      return { isValid: false, message: '보관된 코스는 초안으로 되돌릴 수 없습니다.' };
    
    case 'published->archived':
      if (hasEnrollments) {
        return { 
          isValid: true, 
          message: '수강생이 있는 코스를 보관하면 신규 수강신청이 차단됩니다. 계속하시겠습니까?' 
        };
      }
      break;
      
    default:
      // 다른 모든 전환은 허용
      break;
  }
  
  return { isValid: true };
};
