export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'media-feature-range-notation': 'prefix',
    // Scoped component selectors have independent, intentional state ordering.
    'no-descending-specificity': null,
    'selector-class-pattern': '^cc-[a-z][a-z0-9-]*$',
    'custom-property-pattern': '^cc-[a-z][a-z0-9-]*$',
    // Light/dark tokens intentionally remain named hexadecimal values for auditing.
    'color-function-notation': 'modern',
  },
};
