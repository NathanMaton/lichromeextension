const CLIENT_ID = '772hjnx7xtcvqf';
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const SCOPES = 'r_liteprofile r_emailaddress r_network';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authenticate') {
    authenticate().then(sendResponse);
    return true;
  } else if (request.action === 'checkConnections') {
    checkConnectionsAtCompany(request.company).then(sendResponse);
    return true;
  }
});

function authenticate() {
  return new Promise((resolve, reject) => {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const code = new URLSearchParams(new URL(redirectUrl).search).get('code');
        exchangeCodeForToken(code).then(resolve).catch(reject);
      }
    });
  });
}

function exchangeCodeForToken(code) {
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const data = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: 'QX5V9phfwLz5Ac1x' // Be very cautious with storing this in the extension
  };

  return fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(data)
  })
  .then(response => response.json())
  .then(data => {
    chrome.storage.local.set({ accessToken: data.access_token });
    return data.access_token;
  });
}

async function fetchConnections() {
  const { accessToken } = await chrome.storage.local.get('accessToken');
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.linkedin.com/v2/connections', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching connections (attempt ${attempt + 1}/${maxRetries}):`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));  // Wait for 5 seconds before retrying
      } else {
        console.error("Failed to fetch connections after multiple attempts");
        throw error;
      }
    }
  }
}

async function checkConnectionsAtCompany(company) {
  const connections = await fetchConnections();
  const matchingConnections = connections.elements.filter(connection => 
    connection.positions && connection.positions.some(position => 
      position.company.name.toLowerCase() === company.toLowerCase()
    )
  );
  return matchingConnections;
}

console.log("Redirect URL:", REDIRECT_URI);