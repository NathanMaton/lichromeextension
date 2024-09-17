let connections = [];

async function loadConnections() {
  try {
    const response = await fetch(chrome.runtime.getURL('myconnections.csv'));
    const csv = await response.text();
    console.log('CSV content:', csv.substring(0, 200) + '...'); // Log the first 200 characters
    const lines = csv.split('\n').slice(3);
    connections = lines.map((line, index) => {
      const [firstName, lastName, url, email, company] = line.split(',');
      const conn = { 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        company: company.trim(), 
        url: url.trim()
      };
      if (firstName.trim() === 'Shannon' && lastName.trim() === 'Yang') {
        console.log(`Shannon Yang found at line ${index + 4}:`, conn);
      }
      return conn;
    });
    console.log('Connections loaded:', connections.length);
    console.log('First few connections:', connections.slice(0, 3));
    console.log('Last few connections:', connections.slice(-3));
  } catch (error) {
    console.error('Error loading connections:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  loadConnections();
});

function findMatchingConnections(company) {
  const companyLower = company.toLowerCase().trim();
  console.log('Searching for company:', companyLower);
  const matches = [];

  connections.forEach(conn => {
    const connCompanyLower = conn.company.toLowerCase().trim();
    if (connCompanyLower && companyLower && (connCompanyLower === companyLower)) {
      matches.push(conn);
      console.log('Exact match found:', conn);
    }
    if (conn.firstName === 'Shannon' && conn.lastName === 'Yang') {
      console.log('Shannon Yang company:', connCompanyLower);
    }
  });

  console.log('Matches:', matches.length);
  return matches.slice(0, 10);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === 'checkConnections') {
    console.log('Checking connections for company:', request.company);
    const matches = findMatchingConnections(request.company);
    console.log('Found matches:', matches);
    sendResponse({ matches });
  }
  return true; // Indicates that the response is sent asynchronously
});

console.log("Background script loaded");