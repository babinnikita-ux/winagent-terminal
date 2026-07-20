import { ProcessResult } from './process-supervisor';
import { PipelineFailureCode } from './schemas';

const ERROR_PATTERNS: Array<[RegExp, PipelineFailureCode]> = [
  [/(sign in|log in|login required|authentication required|auth[_ ]?required|unauthori[sz]ed)/i, 'AUTH_REQUIRED'],
  [/(subscription limit|rate limit|quota|usage limit|try again later)/i, 'SUBSCRIPTION_LIMIT'],
  [/(permission denied|permission required|approval required|access denied)/i, 'PERMISSION_REQUIRED'],
  [/(unsupported|no longer supported|migrate to antigravity)/i, 'UNSUPPORTED_VERSION'],
];

export function classifyProcessFailure(result: ProcessResult): PipelineFailureCode {
  if (result.reason === 'timeout') return 'TIMEOUT';
  const output = `${result.stdout}\n${result.stderr}`;
  for (const [pattern, code] of ERROR_PATTERNS) {
    if (pattern.test(output)) return code;
  }
  return 'PROCESS_CRASH';
}
