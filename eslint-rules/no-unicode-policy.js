/**
 * ESLint Rule: No-Unicode Policy
 * ID: STD-DOC-003
 * Version: 2.1.3
 * Level: [C] Critical
 *
 * Enforces prohibition of emoji and Unicode graphic characters in source code.
 * Icons must use SVG (Lucide React) instead.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce No-Unicode Policy - prohibit emoji and Unicode graphic characters',
      category: 'Best Practices',
      recommended: true
    },
    messages: {
      unicodeInLiteral: 'Unicode graphics prohibited in string literal. Use Lucide SVG icons instead.',
      unicodeInTemplate: 'Unicode graphics prohibited in template literal. Use Lucide SVG icons instead.',
      unicodeInJSX: 'Unicode graphics prohibited in JSX. Use Lucide SVG icons instead.'
    }
  },
  create(context) {
    // Emoji and Unicode graphics pattern
    const emojiPattern = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]/u;

    return {
      Literal(node) {
        if (typeof node.value === 'string' && emojiPattern.test(node.value)) {
          context.report({
            node,
            messageId: 'unicodeInLiteral'
          });
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          if (quasi.value.cooked && emojiPattern.test(quasi.value.cooked)) {
            context.report({
              node,
              messageId: 'unicodeInTemplate'
            });
            break;
          }
        }
      },
      JSXText(node) {
        if (emojiPattern.test(node.value)) {
          context.report({
            node,
            messageId: 'unicodeInJSX'
          });
        }
      }
    };
  }
};
