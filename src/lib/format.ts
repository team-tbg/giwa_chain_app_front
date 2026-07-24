/** 금액 입력 표시용 — 원시 숫자문자열을 3자리마다 콤마로 묶는다.
 *  입력 state에는 콤마 없는 숫자문자열(digits)을 보관하고, 화면 value에만 이 함수를 쓴다. */

/** 콤마 등 비숫자를 떼어낸 순수 숫자문자열. */
export const onlyDigits = (s: string): string => s.replace(/[^0-9]/g, '');

/** 숫자문자열을 "1,234,567" 형태로. 빈 값이면 빈 문자열. */
export const groupDigits = (s: string): string => {
  const d = onlyDigits(s);
  return d ? Number(d).toLocaleString('ko-KR') : '';
};
