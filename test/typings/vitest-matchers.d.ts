import 'vitest';

declare module 'vitest' {
  // jest-axe의 toHaveNoViolations 매처 타입
  interface Assertion {
    toHaveNoViolations(): void;
  }
}
