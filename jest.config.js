module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'jsdom',
      testMatch: ['**/content.test.js'],
    },
    {
      displayName: 'integration',
      preset: 'jest-puppeteer',
      testEnvironment: 'node',
      testMatch: ['**/content.integration.test.js'],
    },
  ],
};