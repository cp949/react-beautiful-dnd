// @types/jest-axe는 전역 jest 타입(@types/jest)을 끌어와 vitest의 expect 타입과 충돌한다.
// 이 저장소에서 쓰는 부분만 직접 선언한다.
declare module 'jest-axe' {
  export const axe: (html: Element | string) => Promise<unknown>;
  export const toHaveNoViolations: {
    toHaveNoViolations: (results: unknown) => {
      pass: boolean;
      message: () => string;
    };
  };
}
