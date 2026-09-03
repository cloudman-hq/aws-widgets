module.exports = {
  "verbose": true,
  // forge/ is an independent Forge app with its own runner (node --test +
  // vitest, see forge/package.json). It also excludes root TypeScript in
  // tsconfig.json for the same reason: two subtrees, two toolchains.
  "testPathIgnorePatterns": ["/node_modules/", "<rootDir>/forge/"],
  "testMatch": [
    "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  // ! ts, tsx is not included by default
  "moduleFileExtensions": ['js', 'jsx', 'ts', 'tsx'],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.svg$": "jest-svg-transformer"
  },
};
