import styled from '@emotion/styled';
import { colors } from '../../stories/src/colors';

// 모든 스토리를 감싸는 main landmark다. Lighthouse 접근성 감사의 landmark-one-main 규칙이 요구한다.
const GlobalStyles = styled.main`
  min-height: 100vh;
  color: ${colors.N900};
`;

export default GlobalStyles;
