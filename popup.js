document.addEventListener('DOMContentLoaded', () => {
  const messageElement = document.createElement('p');
  document.body.appendChild(messageElement);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      messageElement.textContent = `Error: ${chrome.runtime.lastError.message}`;
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { action: 'getCompany' }, (response) => {
      if (chrome.runtime.lastError) {
        messageElement.textContent = `Error: ${chrome.runtime.lastError.message}`;
        return;
      }

      if (!response) {
        messageElement.textContent = 'No response from content script. Make sure you are on a LinkedIn page.';
        return;
      }

      if (response.isJobPosting) {
        messageElement.textContent = `Job posting detected for company: ${response.company}`;
        chrome.runtime.sendMessage({ action: 'checkConnections', company: response.company }, (connections) => {
          const connectionsList = document.getElementById('connections-list');
          if (connections && connections.length > 0) {
            connections.forEach(connection => {
              const connectionElement = document.createElement('p');
              connectionElement.textContent = `${connection.firstName} ${connection.lastName}`;
              connectionsList.appendChild(connectionElement);
            });
          } else {
            connectionsList.textContent = 'No connections found at this company.';
          }
        });
      } else {
        messageElement.textContent = 'No job posting detected on this page.';
      }
    });
  });
});