console.log("Content script loaded");

function checkForJobPosting() {
  console.log("Checking for job posting...");
  
  // Check for LinkedIn job posting
  let jobTitleElement = document.querySelector('.job-view-title, .jobs-unified-top-card__job-title');
  let companyElement = document.querySelector('.jobs-unified-top-card__company-name, .jobs-unified-top-card__subtitle-primary-grouping .jobs-unified-top-card__company-name');
  
  // If not found, check for Greenhouse.io job posting
  if (!jobTitleElement || !companyElement) {
    jobTitleElement = document.querySelector('h1.app-title');
    companyElement = document.querySelector('span.company-name');
  }
  
  if (jobTitleElement && companyElement) {
    const jobTitle = jobTitleElement.textContent.trim();
    let companyName = companyElement.textContent.trim();
    // Remove "at " prefix if present
    companyName = companyName.replace(/^at\s+/i, '');
    console.log("Detected Job Title:", jobTitle);
    console.log("Detected Company Name:", companyName);
    return { isJobPosting: true, company: companyName, jobTitle: jobTitle };
  }
  console.log("No job posting detected");
  return { isJobPosting: false };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);
  if (request.action === 'getCompany') {
    const result = checkForJobPosting();
    console.log("Sending response:", result);
    sendResponse(result);
  }
  return true; // Keep the message channel open for asynchronous response
});

console.log("Content script setup complete");