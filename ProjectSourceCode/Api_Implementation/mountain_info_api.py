# We want an individual cs output for each mountain
    # runs csv file format
        # resort, name, open, groomed, difficulty
    # chairs csv file format
        # resort, name, open, type, vertical

import requests
import csv
import os
from datetime import datetime

# Replace these with actual API endpoints
api_urls = {
    "Copper": "https://api.coppercolorado.com/api/v1/dor/lift-trail-report",
    "Winter_Park": "https://mtnpowder.com/feed/v3.json?bearer_token=cku0FJeF71XjrOKXAHWA1wfNfcUr8vqyAWbIwp4v3SQ&resortId%5B%5D=5",
    "Steamboat": "https://mtnpowder.com/feed/v3.json?bearer_token=cku0FJeF71XjrOKXAHWA1wfNfcUr8vqyAWbIwp4v3SQ&resortId%5B%5D=6"
}
lift_headers = ["resort", "name", "open", "type"]
run_headers = ["resort", "name", "open", "groomed", "difficultly"]

### Functions For All Resorts ###

# API fetch function for all resorts
def fetch_resort_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()  # Assumes the API returns JSON
    except Exception as e:
        print(f"Error fetching data from {url}: {e}")
        return None

# Takes a 2d array of lift data
def write_to_lift_csv(resort, data):
    file_path = f"{resort}_lifts.csv"
    with open(file_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(lift_headers)
        writer.writerows(data)

# Takes a 2d array of run data
def write_to_run_csv(resort, data):
    file_path = f"{resort}_runs.csv"
    with open(file_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(run_headers)
        writer.writerows(data)
    
### Individual Resort Formatting ###

def get_copper_data():
    response = fetch_resort_data(api_urls["Copper"])
    lift_data = []
    for lift in response["lift"]:
        lift_data.append([
            "Copper",
            lift['name'],
            lift['status'],
            lift['type']
        ])
    write_to_lift_csv("Copper", lift_data)
    run_data = []
    for run in response["trail"]:
        run_data.append([
            "Copper",
            run['name'],
            run['status'],
            run['groom_status'],
            run['difficulty']
        ])
    write_to_run_csv("Copper", run_data)

def get_steamboat_data():
    response = fetch_resort_data(api_urls["Steamboat"])
    lift_data = []
    run_data = []
    for area in response["Resorts"][0]["MountainAreas"]:
        for lift in area["Lifts"]:
            lift_data.append([
                "Steamboat",
                lift['Name'],
                lift['StatusIcon'],
                lift['LiftType']
            ])
        for run in area["Trails"]:
            run_data.append([
                "Steamboat",
                run['Name'],
                run['Status'],
                run['Grooming'],
                run['Difficulty']
            ])
    write_to_lift_csv("Steamboat", lift_data)
    write_to_run_csv("Steamboat", run_data)

def get_winter_park_data():
    response = fetch_resort_data(api_urls["Winter_Park"])
    lift_data = []
    run_data = []
    for area in response["Resorts"][0]["MountainAreas"]:
        for lift in area["Lifts"]:
            lift_data.append([
                "Winter Park",
                lift['Name'],
                lift['StatusIcon'],
                lift['LiftType']
            ])
        for run in area["Trails"]:
            run_data.append([
                "Winter Park",
                run['Name'],
                run['Status'],
                run['Grooming'],
                run['Difficulty']
            ])
    write_to_lift_csv("Winter_Park", lift_data)
    write_to_run_csv("Winter_Park", run_data)