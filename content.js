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
  
  console.log("Job Title Element:", jobTitleElement);
  console.log("Company Element:", companyElement);

  if (jobTitleElement && companyElement) {
    const jobTitle = jobTitleElement.textContent.trim();
    const companyName = companyElement.textContent.trim();
    console.log("Job Title:", jobTitle);
    console.log("Company Name:", companyName);
    return { isJobPosting: true, company: companyName, jobTitle: jobTitle };
  }
  console.log("No job posting detected");
  return { isJobPosting: false };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.action === 'getCompany') {
    const result = checkForJobPosting();
    console.log("Sending response:", result);
    sendResponse(result);
  }
});

// Run the check when the page loads
console.log("Content script loaded");
checkForJobPosting();