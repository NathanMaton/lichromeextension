const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const SCOPES = 'r_liteprofile r_emailaddress';

async function testLinkedInAuth() {
  try {
    const accessToken = await authenticate();
    console.log('Authentication successful. Access token:', accessToken);

    const userId = await fetchUserId(accessToken);
    console.log('Success! User ID:', userId);
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

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
    client_secret: CLIENT_SECRET
  };

  return fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(data)
  })
  .then(response => response.json())
  .then(data => data.access_token);
}

async function fetchUserId(accessToken) {
  const response = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

// Run the test
testLinkedInAuth();