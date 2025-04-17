import pandas as pd
import os

data_files = [
    "./output/Copper_lifts.csv",
    "./output/Copper_runs.csv",
    "./output/Eldora_lifts.csv",
    "./output/Eldora_runs.csv",
    "./output/Steamboat_lifts.csv",
    "./output/Steamboat_runs.csv",
    "./output/Winter_Park_lifts.csv",
    "./output/Winter_Park_runs.csv",

    "./output/copper_weather.csv",
    "./output/eldora_weather.csv",
    "./output/steamboat_weather.csv",
    "./output/winter_park_weather.csv"
]
output_file = "../init_data/insert_mountain_data.sql"

def csv_to_insert(df, table_name):
    cols = ", ".join(df.columns)
    values = [
        "(" + ", ".join([f"'{str(val).replace("'", "''")}'" for val in row]) + ")"
        for row in df.values
    ]
    return f"INSERT INTO {table_name} ({cols}) VALUES\n" + ",\n".join(values) + ";\n\n"

def generate_insert_sql():
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("-- AUTO-GENERATED MOUNTAIN INSERTS --\n\n")
        for file in data_files:
            table_name = os.path.basename(file).replace(".csv", "").lower()  # copper_lifts
            df = pd.read_csv(file, encoding='utf-8', encoding_errors='replace')
            print(f"Processing {file} -> {table_name}")
            f.write(csv_to_insert(df, table_name))