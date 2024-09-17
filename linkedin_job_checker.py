import requests
from bs4 import BeautifulSoup
import sys

def check_job_posting(url):
    print(f"Checking job posting at: {url}")
    
    # Send a GET request to the URL
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return
    
    # Parse the HTML content
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Try to find the job title and company name
    job_title_element = soup.select_one('.job-view-title, .jobs-unified-top-card__job-title')
    company_element = soup.select_one('.jobs-unified-top-card__company-name, .jobs-unified-top-card__subtitle-primary-grouping .jobs-unified-top-card__company-name')
    
    if job_title_element and company_element:
        job_title = job_title_element.text.strip()
        company_name = company_element.text.strip()
        print(f"Job posting detected!")
        print(f"Job Title: {job_title}")
        print(f"Company: {company_name}")
        
        # Simulate checking for connections
        mock_connections = [
            {"firstName": "John", "lastName": "Doe"},
            {"firstName": "Jane", "lastName": "Smith"}
        ]
        print("\nSimulated Connections:")
        for connection in mock_connections:
            print(f"- {connection['firstName']} {connection['lastName']}")
    else:
        print("No job posting detected on this page.")
        if not job_title_element:
            print("Could not find job title element.")
        if not company_element:
            print("Could not find company name element.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python linkedin_job_checker.py <linkedin_job_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    check_job_posting(url)