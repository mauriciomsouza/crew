export interface SecretFinding {
  line: number;
  rule: string;
  preview: string;
}

/**
 * High-signal patterns only. A doctor that cries wolf gets ignored, so these
 * target formats that are almost never legitimate in an agent prompt.
 */
const RULES: { rule: string; pattern: RegExp }[] = [
  { rule: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { rule: 'AWS access key', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  {
    rule: 'GitHub token',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  },
  { rule: 'Anthropic API key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { rule: 'OpenAI-style API key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}\b/ },
  { rule: 'Slack token', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { rule: 'Stripe live key', pattern: /\b[rs]k_live_[A-Za-z0-9]{20,}\b/ },
  { rule: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  {
    rule: 'hard-coded credential',
    pattern:
      /\b(?:api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*["']?(?!\$\{|<|your|xxx|changeme|example)[A-Za-z0-9/+_.-]{16,}/i,
  },
];

function redact(match: string): string {
  if (match.length <= 8) return '****';
  return `${match.slice(0, 4)}…${match.slice(-2)}`;
}

export function findSecrets(content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  content.split(/\r?\n/).forEach((text, index) => {
    for (const { rule, pattern } of RULES) {
      const match = pattern.exec(text);
      if (match) {
        findings.push({ line: index + 1, rule, preview: redact(match[0]) });
        break;
      }
    }
  });
  return findings;
}
