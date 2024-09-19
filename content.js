console.log("Content script loaded");

function checkForJobPosting() {
  const companyName = document.querySelector('.company-name') || document.querySelector('#header .company-name');

  if (companyName) {
    return {
      isJobPosting: true,
      company: companyName.textContent.trim().replace(/^at\s+/, '')
    };
  }

  return { isJobPosting: false };
}

function checkConnections(callback) {
  chrome.runtime.sendMessage({ action: 'checkConnections' }, (response) => {
    callback(response);
  });
}

// Make the functions available for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkForJobPosting, checkConnections };
}

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    if (request.action === 'getCompany') {
      const result = checkForJobPosting();
      console.log("Sending response:", result);
      sendResponse(result);
    } else if (request.action === 'checkConnections') {
      checkConnections((connections) => {
        sendResponse(connections);
      });
      return true; // Keep the message channel open for asynchronous response
    }
  });
}

console.log("Content script setup complete");