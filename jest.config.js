module.exports = {
  "verbose": true,
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
