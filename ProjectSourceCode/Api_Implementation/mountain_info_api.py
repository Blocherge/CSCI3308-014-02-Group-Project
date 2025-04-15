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
    "Steamboat": "https://mtnpowder.com/feed/v3.json?bearer_token=cku0FJeF71XjrOKXAHWA1wfNfcUr8vqyAWbIwp4v3SQ&resortId%5B%5D=6",
    "Eldora": "https://api.eldora.com/api/v1/dor/lift-trail-report"
}
lift_headers = ["resort", "name", "open", "type"]
run_headers = ["resort", "name", "open", "groomed", "difficultly"]
output_dir = "./output"

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
    file_path = os.path.join(output_dir, f"{resort}_lifts.csv")
    with open(file_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(lift_headers)
        writer.writerows(data)

# Takes a 2d array of run data
def write_to_run_csv(resort, data):
    file_path = os.path.join(output_dir, f"{resort}_runs.csv")
    with open(file_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(run_headers)
        writer.writerows(data)

def standardize_run_data(run_data):
    for i in range(len(run_data)):
        # open
        if "open" in run_data[i][2].lower():
            run_data[i][2] = True
        else:
            run_data[i][2] = False

        # groomed
        if "yes" in run_data[i][3] or "groomed" in run_data[i][3]:
            run_data[i][3] = True
        else:
            run_data[i][3] = False

        # difficulty
        match run_data[i][4]:
            case "Easy" | "easiest":
                run_data[i][4] = 1
            case "Intermediate" | "more_difficult":
                run_data[i][4] = 2
            case "Advanced Intermediate" | "most_difficult":
                run_data[i][4] = 3
            case "Expert" | "extreme":
                run_data[i][4] = 4
            case "Extreme Terrain" | "extreme_terrain":
                run_data[i][4] = 5
            case _:
                run_data[i][4] = 0

    return run_data

def standardize_lift_data(lift_data):
    # Standardize output (lifts)
    for i in range(len(lift_data)):
        # open
        if "open" in lift_data[i][2].lower():
            lift_data[i][2] = True
        else:
            lift_data[i][2] = False

    return lift_data
        
    
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
    run_data = []
    for run in response["trail"]:
        run_data.append([
            "Copper",
            run['name'],
            run['status'],
            run['groom_status'],
            run['difficulty']
        ])

    lift_data = standardize_lift_data(lift_data)
    run_data = standardize_run_data(run_data)

    write_to_lift_csv("Copper", lift_data)
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

    lift_data = standardize_lift_data(lift_data)
    # For some reason, Extreme Terrain at steamboat is only called "Expert" and black diamonds are "Advanced"
    for i in range(len(run_data)):
        if run_data[i][4] == "Expert":
            run_data[i][4] = "Extreme Terrain"
        elif run_data[i][4] == "Advanced":
            run_data[i][4] = "Expert"
    run_data = standardize_run_data(run_data)

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

    run_data = standardize_run_data(run_data)
    lift_data = standardize_lift_data(lift_data)
    
    write_to_lift_csv("Winter_Park", lift_data)
    write_to_run_csv("Winter_Park", run_data)

def get_eldora_data():
    response = fetch_resort_data(api_urls["Eldora"])
    lift_data = []
    for lift in response["lift"]:
        lift_data.append([
            "Eldora",
            lift['name'],
            lift['status'],
            lift['type']
        ])
    run_data = []
    for run in response["trail"]:
        run_data.append([
            "Eldora",
            run['name'],
            run['status'],
            run['groom_status'],
            run['difficulty']
        ])

    lift_data = standardize_lift_data(lift_data)
    run_data = standardize_run_data(run_data)

    write_to_lift_csv("Eldora", lift_data)
    write_to_run_csv("Eldora", run_data)

def get_all_mountains_data():
    get_copper_data()
    get_steamboat_data()
    get_winter_park_data()
    get_eldora_data()