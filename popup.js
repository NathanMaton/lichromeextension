document.addEventListener('DOMContentLoaded', function() {
  const checkButton = document.getElementById('checkButton');
  const statusDiv = document.getElementById('status');
  const connectionsDiv = document.getElementById('connections');

  function injectContentScript(tabId) {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ['content.js']
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  function displayConnections(connections, company) {
    connectionsDiv.innerHTML = '';
    if (connections.length > 0) {
      const ul = document.createElement('ul');
      connections.forEach(conn => {
        const li = createConnectionListItem(conn);
        ul.appendChild(li);
      });
      connectionsDiv.appendChild(ul);
    } else {
      connectionsDiv.textContent = `No exact matches found at ${company}.`;
    }
  }

  function createConnectionListItem(conn) {
    const li = document.createElement('li');
    if (conn.url) {
      li.innerHTML = `<a href="${conn.url}" target="_blank">${conn.firstName} ${conn.lastName}</a> - ${conn.company}`;
    } else {
      li.textContent = `${conn.firstName} ${conn.lastName} - ${conn.company}`;
    }
    return li;
  }

  checkButton.addEventListener('click', function() {
    statusDiv.textContent = 'Checking for connections...';
    connectionsDiv.textContent = '';

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }

      injectContentScript(tabs[0].id)
        .then(() => {
          chrome.tabs.sendMessage(tabs[0].id, {action: "getCompany"}, function(response) {
            if (chrome.runtime.lastError) {
              statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
              return;
            }

            if (response && response.isJobPosting) {
              console.log("Checking connections for company:", response.company);
              chrome.runtime.sendMessage({action: "checkConnections", company: response.company}, function(result) {
                if (chrome.runtime.lastError) {
                  statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
                  return;
                }
                console.log('Received matches:', result.matches);
                if (result && result.matches) {
                  statusDiv.textContent = `Found ${result.matches.length} exact match(es) at ${response.company}`;
                  displayConnections(result.matches, response.company);
                } else {
                  statusDiv.textContent = `No exact matches found at ${response.company}`;
                }
              });
            } else {
              statusDiv.textContent = 'No job posting detected on this page.';
            }
          });
        })
        .catch((error) => {
          statusDiv.textContent = 'Error injecting content script: ' + error.message;
        });
    });
  });
});