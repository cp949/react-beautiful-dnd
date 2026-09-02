import { useEffect } from 'react';
import { error } from '../dev-warning';
import useDev from './use-dev';

export default function useDevSetupWarning(fn: () => void, inputs?: unknown[]) {
  useDev(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      try {
        fn();
      } catch (e) {
        error(`
          A setup problem was encountered.

          > ${e instanceof Error ? e.message : String(e)}
        `);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, inputs);
  });
}
