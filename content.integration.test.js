const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Read the content of content.js
const contentScript = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

// Mock chrome object
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  }
};

const { checkForJobPosting, checkConnections } = require('./content');

describe('Job Posting Detection and Connection Checking Integration Test', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Inject the content script into the page
    await page.evaluateOnNewDocument(contentScript);
  });

  afterEach(async () => {
    await page.close();
  });

  test('detects Anthropic job posting on Greenhouse.io', async () => {
    await page.goto('https://boards.greenhouse.io/anthropic/jobs/4104496008', { waitUntil: 'networkidle0' });
    
    const result = await page.evaluate(() => checkForJobPosting());
    console.log('checkForJobPosting result:', result);

    expect(result).toEqual({
      isJobPosting: true,
      company: 'Anthropic',
    });
  });

  test('returns false for non-job posting page', async () => {
    await page.goto('https://www.example.com', { waitUntil: 'networkidle0' });
    
    const result = await page.evaluate(() => checkForJobPosting());
    console.log('checkForJobPosting result for non-job page:', result);

    expect(result).toEqual({ isJobPosting: false });
  });

  test('finds Shannon Yang as a connection when checking connections', async () => {
    await page.goto('https://boards.greenhouse.io/anthropic/jobs/4019740008', { waitUntil: 'networkidle0' });
    
    // Mock the chrome.runtime.sendMessage function
    await page.evaluate(() => {
      window.chrome = {
        runtime: {
          sendMessage: (message, callback) => {
            if (message.action === 'checkConnections') {
              callback({ matches: [{ firstName: 'Shannon', lastName: 'Yang', company: 'Anthropic' }] });
            }
          }
        }
      };
    });

    // Simulate clicking the "Check Connections" button
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        checkConnections((connections) => {
          resolve(connections);
        });
      });
    });

    console.log('Connections found:', result);

    expect(result.matches).toContainEqual(expect.objectContaining({
      firstName: 'Shannon',
      lastName: 'Yang',
      company: 'Anthropic'
    }));
  });
});