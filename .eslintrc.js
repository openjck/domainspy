module.exports = {
    root: true,
    plugins: ['json', 'node'],
    extends: ['plugin:node/recommended', '@openjck/eslint-config-base'],
    env: {
        node: true,
    },
    rules: {
        'consistent-return': 'off',
    },
};
