export const ROLE_IDS = [
  'business',
  'design',
  'dev',
  'qa',
  'infra',
  'release',
  'marketing',
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export interface OwnedDoc {
  path: string;
  title: string;
  /** Section headings for the stub created on init. */
  sections: string[];
  purpose: string;
}

export interface Gate {
  name: string;
  question: string;
}

export interface Role {
  id: RoleId;
  title: string;
  owns: string;
  deliverable: string;
  /** One-line summary for the flow diagram. */
  flow: string;
  docs: OwnedDoc[];
  /** The owner gate this role brings to the human, if any. */
  gate?: Gate;
}

export const ROLES: Record<RoleId, Role> = {
  business: {
    id: 'business',
    title: 'Business',
    owns: 'Problem, audience, scope, success metric',
    deliverable: 'Brief with scope (in / out) and acceptance criteria',
    flow: 'scope · metric · acceptance criteria',
    docs: [
      {
        path: 'docs/business/BUSINESS.md',
        title: 'Business',
        purpose: 'Problem, audience, positioning, success metrics',
        sections: [
          'Problem',
          'Who it is for',
          'Positioning',
          'Sustainability model',
          'Success metrics',
          'Assumptions and risks',
          'Decision log',
        ],
      },
    ],
    gate: { name: 'Scope', question: 'Is this the right problem and the right cut?' },
  },
  design: {
    id: 'design',
    title: 'Design',
    owns: 'Flows, states, copy, design system',
    deliverable: 'Spec with every state, plus rendered mockups',
    flow: 'flows · states · copy · mockups',
    docs: [
      {
        path: 'docs/design/DESIGN_SPEC.md',
        title: 'Design spec',
        purpose: 'Design system: tokens, type, components, states',
        sections: ['Principles', 'Tokens', 'Typography', 'Components', 'Accessibility'],
      },
    ],
    gate: { name: 'Design', question: 'Does this look and behave the way the product should?' },
  },
  dev: {
    id: 'dev',
    title: 'Dev',
    owns: 'Application code, tests, stack choices',
    deliverable: 'Small tested change, ready for review',
    flow: 'code · tests · screenshots',
    docs: [
      {
        path: 'docs/STACK.md',
        title: 'Stack',
        purpose: 'Technology choices and the reason for each',
        sections: ['Runtime and language', 'Dependencies', 'Conventions', 'Decisions'],
      },
    ],
  },
  qa: {
    id: 'qa',
    title: 'QA',
    owns: 'Independent verification, test plan',
    deliverable: 'PASS or FAIL verdict with evidence',
    flow: 'independent verdict, with evidence',
    docs: [
      {
        path: 'docs/qa/TEST_PLAN.md',
        title: 'Test plan',
        purpose: 'Standing checks and test strategy',
        sections: ['Standing checks', 'Strategy', 'Risky areas', 'Bug severity'],
      },
    ],
  },
  infra: {
    id: 'infra',
    title: 'Infra',
    owns: 'CI/CD, environments, secrets handling, cost',
    deliverable: 'Green pipeline and a runbook with rollback',
    flow: 'CI · environments · deploys',
    docs: [
      {
        path: 'docs/infra/RUNBOOK.md',
        title: 'Runbook',
        purpose: 'How to deploy, roll back and recover',
        sections: ['Environments', 'Environment variables', 'Deploy', 'Rollback', 'Incidents'],
      },
    ],
    gate: { name: 'Production', question: 'May this change touch production, billing or secrets?' },
  },
  release: {
    id: 'release',
    title: 'Release',
    owns: 'Versioning, changelog, release checklist',
    deliverable: 'Versioned release and a go/no-go question',
    flow: 'changelog · version · go/no-go',
    docs: [
      {
        path: 'docs/release/RELEASING.md',
        title: 'Releasing',
        purpose: 'Release checklist and rollback',
        sections: ['Versioning', 'Checklist', 'Rollback'],
      },
    ],
    gate: { name: 'Ship', question: 'Go or no-go for this version?' },
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing',
    owns: 'Positioning copy, launch plan, announcements',
    deliverable: 'Ready-to-post drafts per channel',
    flow: 'launch drafts per channel',
    docs: [
      {
        path: 'docs/marketing/LAUNCH.md',
        title: 'Launch',
        purpose: 'Voice, channels, launch plan, drafts',
        sections: ['Voice', 'Channels', 'Launch plan', 'Drafts'],
      },
    ],
    gate: { name: 'Publish', question: 'May this be posted publicly, here and now?' },
  },
};

export const DEFAULT_ROLES: RoleId[] = ['business', 'design', 'dev', 'qa'];

export function isRoleId(value: string): value is RoleId {
  return (ROLE_IDS as readonly string[]).includes(value);
}

/** Validates and sorts a role list into canonical order; throws on unknown ids. */
export function normalizeRoles(input: readonly string[]): RoleId[] {
  const unknown = input.filter((r) => !isRoleId(r));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown role${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Available: ${ROLE_IDS.join(', ')}`,
    );
  }
  return ROLE_IDS.filter((id) => input.includes(id));
}
