// prepublishOnly에서 호출하는 가드다.
// 실제 npm publish는 태그 push로 실행되는 GitHub Actions(trusted publishing)에서만 허용한다.
// 로컬에는 npm 토큰이 없어 publish가 실패하므로, 직접 실행은 의도와 무관하게 막는다.
const env = process.env;

const isDryRun = env.npm_config_dry_run === 'true';
const isTagWorkflow =
  env.GITHUB_ACTIONS === 'true' && env.GITHUB_REF_TYPE === 'tag';

if (!isDryRun && !isTagWorkflow) {
  process.stderr.write(
    '[PUBLISH_DIRECT_DENIED] 로컬 npm publish는 허용하지 않습니다. pnpm release로 버전 태그를 push하면 GitHub Actions가 배포합니다.\n',
  );
  process.exit(1);
}
