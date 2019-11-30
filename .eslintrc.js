module.exports = {
    root: true,
    plugins: ["prettier", "json", "node"],
    extends: ["airbnb-base", "plugin:node/recommended", "prettier"],
    env: {
        node: true
    },
    rules: {
        "consistent-return": "off"
    }
};
