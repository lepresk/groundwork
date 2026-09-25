/**
 * Conventional Commits, enforced by the `commit-msg` hook and in CI.
 * Scopes are optional but must match a workspace or a cross-cutting area.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['api', 'worker', 'web', 'db', 'shared', 'ui', 'config', 'ci', 'deps', 'docs', 'ai', 'repo'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
};
