module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: 'eslint:recommended',
    plugins: [
        'json',
    ],
    rules: {
        // Errors
        'eqeqeq': 'error',
        'no-global-assign': 'error',
        'no-redeclare': ['error', {builtinGlobals: true}],
        'no-shadow': ['error', {builtinGlobals: true}],
        'no-var': 'error',

        // Warnings
        'prefer-arrow-callback': 'warn',
        'prefer-const': 'warn',
        'semi': ['warn', 'always'],
        'comma-dangle': ['warn', 'always-multiline'],

        // Off
        'no-console': 'off',
    },
};
