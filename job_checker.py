import os
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import sys
import json
from urllib.parse import urlencode
from http.server import HTTPServer, BaseHTTPRequestHandler
import webbrowser
import threading
import time

# Load environment variables
load_dotenv()

# Replace these with your LinkedIn API credentials
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')
SCOPES = os.getenv('SCOPES')

access_token = None

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global access_token
        if self.path.startswith('/callback'):
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Authentication successful! You can close this window.')
            code = self.path.split('code=')[1].split('&')[0]
            access_token = get_access_token(code)
        else:
            self.send_response(404)
            self.end_headers()

def start_server():
    httpd = HTTPServer(('localhost', 8000), CallbackHandler)
    httpd.handle_request()

def get_access_token(code):
    url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    response = requests.post(url, data=data)
    return response.json()['access_token']

def authenticate():
    global access_token
    auth_url = f'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={SCOPES}'
    webbrowser.open(auth_url)
    start_server()

def get_connections(company):
    url = 'https://api.linkedin.com/v2/connections'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()  # Raise an exception for bad status codes
            connections = response.json()['elements']
            
            matching_connections = [
                conn for conn in connections
                if 'positions' in conn and any(pos['company']['name'].lower() == company.lower() for pos in conn['positions'])
            ]
            return matching_connections
        except requests.exceptions.RequestException as e:
            print(f"Error fetching connections (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(5)  # Wait for 5 seconds before retrying
            else:
                print("Failed to fetch connections after multiple attempts")
                return []

def check_job_posting(url):
    print(f"Checking job posting at: {url}")
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    job_title_element = soup.select_one('h1.app-title, h1')
    company_element = soup.select_one('span.company-name, .company-name, .organization-name')
    
    if job_title_element and company_element:
        job_title = job_title_element.text.strip()
        company_name = company_element.text.strip()
        print(f"\nJob Title: {job_title}")
        print(f"Company: {company_name}")
        print(f"\nJob posting detected!")
        
        try:
            authenticate()
            connections = get_connections(company_name)
        except Exception as e:
            print(f"Error during authentication or fetching connections: {e}")
            connections = []
        
        print("\nConnections at this company:")
        if connections:
            for connection in connections:
                print(f"- {connection['firstName']} {connection['lastName']}")
        else:
            print("No connections found at this company.")
    else:
        print("\nNo job posting detected on this page.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python job_checker.py <job_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    check_job_posting(url)