import os
import requests
from flask import Flask, request
from urllib.parse import urlencode
import webbrowser
from dotenv import load_dotenv
import secrets

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI', 'http://localhost:8000/callback')
SCOPES = os.getenv('SCOPES', 'r_liteprofile r_emailaddress r_1st_connections')

auth_code = None

@app.route('/callback')
def callback():
    global auth_code
    auth_code = request.args.get('code')
    return "Authentication successful! You can close this window now."

def authenticate():
    if not CLIENT_ID:
        raise ValueError("CLIENT_ID is not set in the .env file")
    
    state = secrets.token_urlsafe(16)
    auth_params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': SCOPES
        #'state': state
    }
    auth_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(auth_params)}"
    
    print(f"Please visit this URL to authenticate: {auth_url}")
    webbrowser.open(auth_url)
    
    app.run(port=8000)
    
    return auth_code

def exchange_code_for_token(code):
    if not CLIENT_SECRET:
        raise ValueError("CLIENT_SECRET is not set in the .env file")
    
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()['access_token']

def fetch_user_id(access_token):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    response = requests.get('https://api.linkedin.com/v2/me', headers=headers)
    response.raise_for_status()
    return response.json()['id']

def fetch_connections(access_token):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    url = 'https://api.linkedin.com/v2/connections?q=viewer&start=0&count=5'
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def test_linkedin_auth():
    try:
        code = authenticate()
        access_token = exchange_code_for_token(code)
        print(f'Authentication successful. Access token: {access_token}')

        user_id = fetch_user_id(access_token)
        print(f'Success! User ID: {user_id}')

        connections = fetch_connections(access_token)
        print('First 5 connections:')
        for connection in connections.get('elements', [])[:5]:
            print(f"Connection ID: {connection.get('to', 'N/A')}")

    except ValueError as ve:
        print(f'Configuration error: {str(ve)}')
        print('Please make sure CLIENT_ID and CLIENT_SECRET are set in your .env file.')
    except Exception as e:
        print(f'Authentication failed: {str(e)}')

if __name__ == '__main__':
    test_linkedin_auth()