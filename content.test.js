// Mock the chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

// Import the function to test
const { checkForJobPosting } = require('./content');

describe('checkForJobPosting', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the document body
    document.body.innerHTML = '';
  });

  test('detects Anthropic job posting on Greenhouse.io', () => {
    document.body.innerHTML = `
      <div class="app-title">Research Scientist</div>
      <div class="company-name">
        <a href="https://www.anthropic.com" class="c-link">Anthropic</a>
      </div>
    `;

    const result = checkForJobPosting();
    expect(result).toEqual({
      isJobPosting: true,
      company: 'Anthropic'
    });
  });

  test('returns false when no job posting is detected', () => {
    document.body.innerHTML = `
      <h1>Welcome to our website</h1>
    `;

    const result = checkForJobPosting();
    expect(result).toEqual({ isJobPosting: false });
  });
});