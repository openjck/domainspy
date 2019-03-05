module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',
    ],
    plugins: [
        'json',
        'node',
    ],
    root: true,
    env: {
        node: true,
    },
    rules: {
        // Errors
        'eqeqeq': 'error',
        'no-global-assign': 'error',
        'no-redeclare': ['error', { builtinGlobals: true }],
        'no-shadow': ['error', { builtinGlobals: true }],
        'no-var': 'error',

        // Stylistic warnings
        'prefer-arrow-callback': 'warn',
        'prefer-const': 'warn',
        'semi': ['warn', 'always'],
        'comma-dangle': ['warn', 'always-multiline'],
        'quotes': ['warn', 'single', { avoidEscape: true }],
        'indent': ['warn', 4, { SwitchCase: 1 }],

        // Off
        'no-console': 'off',
    },
};
