// Local ESLint rules. Each one encodes a framework standard (docs/standards.md); keep them few and cheap.

const isTestCall = (n) =>
  n.type === 'CallExpression' &&
  ((n.callee.type === 'Identifier' && n.callee.name === 'test') ||
    (n.callee.type === 'MemberExpression' &&
      n.callee.object.type === 'Identifier' &&
      n.callee.object.name === 'test' &&
      ['describe', 'only', 'skip', 'fixme', 'fail'].includes(n.callee.property.name)));

const tagsOf = (call) => {
  const opts = call.arguments.find((a) => a.type === 'ObjectExpression');
  const tag = opts?.properties.find((p) => p.type === 'Property' && p.key.name === 'tag');
  if (!tag) return [];
  const v = tag.value;
  const lit = (e) => (e.type === 'Literal' ? [String(e.value)] : e.type === 'TemplateLiteral' ? [e.quasis.map((q) => q.value.cooked).join('*')] : []);
  return v.type === 'ArrayExpression' ? v.elements.flatMap(lit) : lit(v);
};

/** Every test must carry a level tag (@L0–@L4) on itself or an enclosing describe. */
const requireLevelTag = {
  meta: { type: 'problem', messages: { missing: 'Test needs a level tag (@L0–@L4) on the test or an enclosing describe.' }, schema: [] },
  create(ctx) {
    return {
      CallExpression(node) {
        if (!isTestCall(node) || (node.callee.type === 'MemberExpression' && node.callee.property.name === 'describe')) return;
        if (node.arguments.length < 2 || (typeof node.arguments[0]?.value !== 'string' && node.arguments[0]?.type !== 'TemplateLiteral')) return; // skip conditional test.skip(cond)
        let cur = node;
        while (cur) {
          if (isTestCall(cur) && tagsOf(cur).some((t) => /^@L[0-4]$/.test(t))) return;
          cur = cur.parent;
        }
        ctx.report({ node, messageId: 'missing' });
      },
    };
  },
};

/** Specs use the target's fixtures (clients, cleanup, auth) — never raw @playwright/test. Setup files are exempt. */
const noPlaywrightImportInSpecs = {
  meta: { type: 'problem', messages: { raw: "Import test/expect from the target's fixtures.ts, not '@playwright/test'." }, schema: [] },
  create(ctx) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@playwright/test' && node.importKind !== 'type') ctx.report({ node, messageId: 'raw' });
      },
    };
  },
};

/** No literal values for credential-like keys. Read them from config/env. */
const SECRET_KEY = /^(password|passwd|secret|otp|apikey|api_key|clientsecret|client_secret|token)$/i;
const noSecretLiterals = {
  meta: { type: 'problem', messages: { lit: 'Credential-like key "{{k}}" has a literal value; read it from config/env.' }, schema: [] },
  create(ctx) {
    return {
      Property(node) {
        const k = node.key.type === 'Identifier' ? node.key.name : node.key.type === 'Literal' ? String(node.key.value) : '';
        if (SECRET_KEY.test(k) && node.value.type === 'Literal' && typeof node.value.value === 'string' && node.value.value !== '') {
          ctx.report({ node, messageId: 'lit', data: { k } });
        }
      },
    };
  },
};

export default {
  rules: { 'require-level-tag': requireLevelTag, 'no-playwright-import-in-specs': noPlaywrightImportInSpecs, 'no-secret-literals': noSecretLiterals },
};
