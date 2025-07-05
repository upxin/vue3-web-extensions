import antfu from "@antfu/eslint-config";

export default antfu({
  rules: {
    "vue/html-self-closing": 0,
    "no-console": 0,
    "@typescript-eslint/ban-ts-comment": 0,
  },
});
