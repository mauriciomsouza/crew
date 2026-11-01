import businessAgent from '../../templates/agents/business.md';
import designAgent from '../../templates/agents/design.md';
import devAgent from '../../templates/agents/dev.md';
import infraAgent from '../../templates/agents/infra.md';
import marketingAgent from '../../templates/agents/marketing.md';
import qaAgent from '../../templates/agents/qa.md';
import releaseAgent from '../../templates/agents/release.md';
import agentTeamDoc from '../../templates/docs/AGENT_TEAM.md';
import claudeDoc from '../../templates/docs/CLAUDE.md';
import planDoc from '../../templates/docs/PLAN.md';
import type { RoleId } from './roles.js';

// Templates are bundled as strings at build time, so the CLI has no runtime
// file lookups and the same core runs unchanged in the browser demo.
export const AGENT_TEMPLATES: Record<RoleId, string> = {
  business: businessAgent,
  design: designAgent,
  dev: devAgent,
  qa: qaAgent,
  infra: infraAgent,
  release: releaseAgent,
  marketing: marketingAgent,
};

export const DOC_TEMPLATES = {
  claude: claudeDoc,
  agentTeam: agentTeamDoc,
  plan: planDoc,
} as const;
