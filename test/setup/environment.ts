import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import JSDOMEnvironment from 'jest-environment-jsdom';
import { TextDecoder, TextEncoder } from 'util';
import { MessageChannel, type MessagePort } from 'worker_threads';

import attachRafStub from './attach-raf-stub';
import transitionEventPolyfill from './transition-event-polyfill';

export default class MyJSDOMEnvironment extends JSDOMEnvironment {
  // resetModules: true 설정 때문에 테스트 파일마다 scheduler가 새 MessageChannel을
  // 생성한다. 이 환경 인스턴스가 만든 포트를 추적해 teardown 시점에 닫지 않으면
  // worker_threads의 열린 핸들이 프로세스 종료를 막아 --forceExit이 필요해진다.
  private readonly openMessagePorts = new Set<MessagePort>();

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);

    attachRafStub.call(this);
    transitionEventPolyfill.call(this);

    // When importing jsdom in one of the test it throws an
    // error, because TextDecoder and TextEncoder are needed.
    this.global.TextDecoder = TextDecoder as typeof this.global.TextDecoder;
    this.global.TextEncoder =
      TextEncoder as unknown as typeof this.global.TextEncoder;

    const openMessagePorts = this.openMessagePorts;
    class TrackedMessageChannel extends MessageChannel {
      constructor() {
        super();
        openMessagePorts.add(this.port1);
        openMessagePorts.add(this.port2);
      }
    }

    // FIXME: There's some types issues here
    this.global.MessageChannel =
      TrackedMessageChannel as unknown as (typeof this.global)['MessageChannel'];
  }

  async teardown(): Promise<void> {
    for (const port of this.openMessagePorts) {
      port.close();
    }
    this.openMessagePorts.clear();

    await super.teardown();
  }
}
