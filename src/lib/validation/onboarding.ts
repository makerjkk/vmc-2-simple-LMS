/**
 * 온보딩 관련 공통 검증 로직
 * 클라이언트와 서버에서 공통으로 사용되는 검증 함수들
 */

/**
 * 이메일 형식 검증
 */
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email) {
    return { isValid: false, message: '이메일을 입력해주세요.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '올바른 이메일 형식을 입력해주세요.' };
  }

  return { isValid: true };
};

/**
 * 비밀번호 강도 검증
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  message?: string; 
  strength: 'weak' | 'medium' | 'strong' 
} => {
  if (!password) {
    return { isValid: false, message: '비밀번호를 입력해주세요.', strength: 'weak' };
  }

  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.', strength: 'weak' };
  }

  // 강도 계산
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (/[a-z]/.test(password)) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^a-zA-Z0-9]/.test(password)) strengthScore++;

  const strength = strengthScore <= 2 ? 'weak' : strengthScore <= 4 ? 'medium' : 'strong';

  return { isValid: true, strength };
};

/**
 * 휴대폰 번호 형식 검증 (010-XXXX-XXXX)
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone) {
    return { isValid: false, message: '휴대폰 번호를 입력해주세요.' };
  }

  const phoneRegex = /^010-\d{4}-\d{4}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: '휴대폰 번호는 010-XXXX-XXXX 형식으로 입력해주세요.' };
  }

  return { isValid: true };
};

/**
 * 휴대폰 번호 자동 포맷팅
 */
export const formatPhoneNumber = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');
  
  // 010으로 시작하지 않으면 010 추가
  const normalizedNumbers = numbers.startsWith('010') ? numbers : `010${numbers}`;
  
  // 포맷팅
  if (normalizedNumbers.length <= 3) {
    return normalizedNumbers;
  } else if (normalizedNumbers.length <= 7) {
    return `${normalizedNumbers.slice(0, 3)}-${normalizedNumbers.slice(3)}`;
  } else {
    return `${normalizedNumbers.slice(0, 3)}-${normalizedNumbers.slice(3, 7)}-${normalizedNumbers.slice(7, 11)}`;
  }
};

/**
 * 이름 검증 (2-50자, 한글/영문)
 */
export const validateFullName = (name: string): { isValid: boolean; message?: string } => {
  if (!name) {
    return { isValid: false, message: '이름을 입력해주세요.' };
  }

  if (name.length < 2) {
    return { isValid: false, message: '이름은 최소 2자 이상이어야 합니다.' };
  }

  if (name.length > 50) {
    return { isValid: false, message: '이름은 최대 50자까지 입력 가능합니다.' };
  }

  const nameRegex = /^[가-힣a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: '이름은 한글 또는 영문만 입력 가능합니다.' };
  }

  return { isValid: true };
};

/**
 * 역할 검증
 */
export const validateRole = (role: string): { isValid: boolean; message?: string } => {
  const validRoles = ['learner', 'instructor'];
  
  if (!role) {
    return { isValid: false, message: '역할을 선택해주세요.' };
  }

  if (!validRoles.includes(role)) {
    return { isValid: false, message: '올바른 역할을 선택해주세요.' };
  }

  return { isValid: true };
};

/**
 * 약관 동의 검증
 */
export const validateTermsAgreement = (agreed: boolean): { isValid: boolean; message?: string } => {
  if (!agreed) {
    return { isValid: false, message: '이용약관에 동의해주세요.' };
  }

  return { isValid: true };
};
