# Changelog

## [1.0.2](https://github.com/cp949/react-beautiful-dnd/compare/v1.0.1...v1.0.2) (2026-11-15)

### Bug Fixes 🛠

* pnpm audit 취약점 해결 (storybook 8.6.19, overrides 추가) ([18dfaef](https://github.com/cp949/react-beautiful-dnd/commit/18dfaefc686d9db253d39a80e33cf7f706d1a530))
* 브라우저 테스트 하네스의 cross-env-shell 경로를 dist/bin으로 수정 ([d5d22fc](https://github.com/cp949/react-beautiful-dnd/commit/d5d22fc25786db463a6d8bb8447645ff446aaf2f))
* 접근성 감사를 위해 스토리 래퍼를 main landmark로 변경 ([36f8f56](https://github.com/cp949/react-beautiful-dnd/commit/36f8f5667084ea7623e88025f8dadc55c6824fda))

### Docs 📃

* readme에 1.0.1 이후 fork 변경사항과 이유 추가, Discord 배지 제거 ([266d0d7](https://github.com/cp949/react-beautiful-dnd/commit/266d0d7e8832f23c3f63f22b976024105ae0d6f3))
* 도메인 용어집 CONTEXT.md 추가 ([c1768bd](https://github.com/cp949/react-beautiful-dnd/commit/c1768bd913a45d4040f29f8b9c40489076ad727a))
* 용어집에 Sensor phase와 Drag phase 구분 추가 ([674907b](https://github.com/cp949/react-beautiful-dnd/commit/674907b34bff702cb8aac2cd4289849a606d83b9))

### Code Refactoring 🖌

* mouse·touch sensor의 capture lifecycle을 한 module로 통합 ([9b80d1a](https://github.com/cp949/react-beautiful-dnd/commit/9b80d1ae0ebc66c0b243b751d8d64f5ebe082bd7))

### Tests 🧪

* reorder Cypress 테스트가 절대 id 대신 화면에서 읽은 id를 비교하도록 수정 ([ad8fcc1](https://github.com/cp949/react-beautiful-dnd/commit/ad8fcc11740f32fb0ee0086b2f39f8c839b889b5))
* stylelint 18(ESM 전용)을 별도 Node 프로세스로 실행하도록 get-styles 테스트 수정 ([ef76a73](https://github.com/cp949/react-beautiful-dnd/commit/ef76a73c4d7066a357e829d875bd666cdb2cf8b3))

### Build System 🏗

* @types/react·react-dom 19, @types/node 24로 상향 ([4d576ef](https://github.com/cp949/react-beautiful-dnd/commit/4d576ef3a6cb8159724f8b2cc03b05bf77866fae))
* babel 8로 상향 (core 8.1.2, preset 8, babel-loader 10) ([d7e6abc](https://github.com/cp949/react-beautiful-dnd/commit/d7e6abcce9480163eec07cb814bef8ecb13fa3a3))
* eslint/prettier를 oxlint/oxfmt로 교체, deepmerge를 @cp949/deepmerge로 대체 ([c509b57](https://github.com/cp949/react-beautiful-dnd/commit/c509b57e412ba36a3cc6318eb237e99ec2718201))
* jest 30으로 상향 (jest-axe 11, jest-dom 7 등) ([ab2854a](https://github.com/cp949/react-beautiful-dnd/commit/ab2854a977830e2446d4241c2ff4cdbf7e9ef3f9))
* pnpm 12 이전, 의존성 갱신, tsdown 0.23.7 업그레이드 ([4df0fd0](https://github.com/cp949/react-beautiful-dnd/commit/4df0fd0ab361d75578c5e7578d231d2c2ab8ccdf))
* stories 전용 의존성 정리 (react-window 2, @atlaskit/theme 제거, css-reset 8) ([e3c84ed](https://github.com/cp949/react-beautiful-dnd/commit/e3c84ed74e5265598f3e0d3bf24a2a5365b12b17))
* storybook 10.6.7로 상향 (addon-essentials·storysource·manager-api·theming 제거) ([5e9f8db](https://github.com/cp949/react-beautiful-dnd/commit/5e9f8dbcfd54b28a56908f6c9094e5800110d4b7))
* stylelint 18 계열로 상향 (config-standard 41, config-recommended 19) ([a40355d](https://github.com/cp949/react-beautiful-dnd/commit/a40355d6a8c641ed19d633d34f75baf4134d1f89))
* tsconfig의 ignoreDeprecations 제거 ([3feb897](https://github.com/cp949/react-beautiful-dnd/commit/3feb897857303ea99609a66cb25042e4442e4c14))
* 개발 의존성 상향 (react 19.3.1, swc, cross-env, commitlint, release-it 등) ([48b8afb](https://github.com/cp949/react-beautiful-dnd/commit/48b8afb0c618d6f2b736c413abdccb6731138053))

### CI 🛠

* circleci를 github actions로 이전 ([52b391d](https://github.com/cp949/react-beautiful-dnd/commit/52b391d694fcf6a84b523d131e152310c6498acc))
* 개발·CI Node 버전을 24.20.0으로 상향 ([22519c5](https://github.com/cp949/react-beautiful-dnd/commit/22519c54bdb79bc8f6e45a597d04e4248248bcce))
* 태그 push 시 GitHub Actions가 npm trusted publishing으로 배포하도록 변경 ([ba228c0](https://github.com/cp949/react-beautiful-dnd/commit/ba228c04f93d4e6d259a54d39e0aecabde9f20e0))

### Others 🔧

* chromatic 제거 ([cda8461](https://github.com/cp949/react-beautiful-dnd/commit/cda8461b68ac9e4f6e74c24dd33281f38b868deb))
* gitignore에 _tmp 디렉터리 추가 ([f1cb866](https://github.com/cp949/react-beautiful-dnd/commit/f1cb866fae6fd8acc9467dd8ba7ef0cc2634bf93))
* renovate 설정 제거 ([c4700de](https://github.com/cp949/react-beautiful-dnd/commit/c4700de291b0ef8a8981a82a369c333916870309))

## <small>1.0.1 (2026-09-02)</small>

* docs: readme에 fork 계보/변경사항 추가, 인물 귀속 섹션 정리 ([67a5377](https://github.com/cp949/react-beautiful-dnd/commit/67a5377))
* docs: 문서에 남아있던 @hello-pangea/dnd 패키지명을 @cp949/react-beautiful-dnd로 교체 ([e82ecc9](https://github.com/cp949/react-beautiful-dnd/commit/e82ecc9))
* chore: add trailing slash to .gitignore (#979) ([9fef8aa](https://github.com/cp949/react-beautiful-dnd/commit/9fef8aa)), closes [#979](https://github.com/cp949/react-beautiful-dnd/issues/979)
* chore: changelog 초기화 ([c5fa2cd](https://github.com/cp949/react-beautiful-dnd/commit/c5fa2cd))
* chore: express 5.2.1로 업그레이드하고 관련 override 정리 ([561c07e](https://github.com/cp949/react-beautiful-dnd/commit/561c07e))
* chore: modernize dnd package build ([525d867](https://github.com/cp949/react-beautiful-dnd/commit/525d867))
* chore: package.json author/maintainers/contributors 정리 ([d475fa7](https://github.com/cp949/react-beautiful-dnd/commit/d475fa7))
* chore: prettier 3.9.6로 업그레이드 ([210f7d2](https://github.com/cp949/react-beautiful-dnd/commit/210f7d2))
* chore: rimraf 6.1.3으로 업그레이드 ([53d0a3f](https://github.com/cp949/react-beautiful-dnd/commit/53d0a3f))
* chore: stylelint 17로 업그레이드 ([5bf4eba](https://github.com/cp949/react-beautiful-dnd/commit/5bf4eba))
* chore: tsdown 요구사항에 맞춰 Node 버전 제약 명시 ([059ddc8](https://github.com/cp949/react-beautiful-dnd/commit/059ddc8))
* chore: webpack 5.110.3으로 업그레이드하고 관련 override 정리 ([66a303c](https://github.com/cp949/react-beautiful-dnd/commit/66a303c))
* fix: cypress config 로드 시 typescript 6 deprecation 에러 수정 ([2cf85d6](https://github.com/cp949/react-beautiful-dnd/commit/2cf85d6))
* fix: hydrateRoot 테스트 act() 누락으로 인한 React 18 크래시 수정 ([aa43ed5](https://github.com/cp949/react-beautiful-dnd/commit/aa43ed5))
* fix: pnpm audit 취약점 완전 해결 (cypress/lighthouse 메이저 업그레이드) ([93f89c1](https://github.com/cp949/react-beautiful-dnd/commit/93f89c1))
* fix: pnpm audit 취약점 정리 (pnpm.overrides 추가) ([66ba8d0](https://github.com/cp949/react-beautiful-dnd/commit/66ba8d0))
* fix: storybook production 빌드에서 alias 깨지는 문제 수정 ([3a7aaa6](https://github.com/cp949/react-beautiful-dnd/commit/3a7aaa6))
* fix: stylelint 17 업그레이드로 인한 테스트 실패 되돌리기 ([48900b1](https://github.com/cp949/react-beautiful-dnd/commit/48900b1))
* fix: 테스트 환경 MessageChannel 포트 누수로 인한 forceExit 의존성 제거 ([7121390](https://github.com/cp949/react-beautiful-dnd/commit/7121390))
* refactor: dist 산출물 basename을 dnd에서 react-beautiful-dnd로 변경 ([b4e8134](https://github.com/cp949/react-beautiful-dnd/commit/b4e8134))
* refactor: eslint-config-airbnb 제거 후 flat config로 전환 ([e1b99a8](https://github.com/cp949/react-beautiful-dnd/commit/e1b99a8))
* refactor: fs-extra/fast-glob 제거하고 Node 내장 API로 대체 ([33df914](https://github.com/cp949/react-beautiful-dnd/commit/33df914))
* refactor: lodash.isequal 제거하고 사용처에 deep-equal 직접 구현 ([231dd16](https://github.com/cp949/react-beautiful-dnd/commit/231dd16))
* refactor: storybook/babel alias를 새 패키지명으로 일괄 변경 ([c6bb993](https://github.com/cp949/react-beautiful-dnd/commit/c6bb993))
* test: markdown 링크 검증 테스트 제거 및 markdown-it 의존성 정리 ([1d8fb2e](https://github.com/cp949/react-beautiful-dnd/commit/1d8fb2e))
