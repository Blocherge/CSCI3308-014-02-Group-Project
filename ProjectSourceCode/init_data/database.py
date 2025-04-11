import pandas as pd
from sqlalchemy import create_engine

# Load your CSV
eldora_df = pd.read_csv('CSCI3308-014-02-Group-Project/ProjectSourceCode/Api_Implementation/output/eldora_daily_weather.csv')
winter_park_df = pd.read_csv('CSCI3308-014-02-Group-Project/ProjectSourceCode/Api_Implementation/output/winterpark_daily_weather.csv')
copper_df = pd.read_csv('CSCI3308-014-02-Group-Project/ProjectSourceCode/Api_Implementation/output/copper_daily_weather.csv')
steamboat_df = pd.read_csv('CSCI3308-014-02-Group-Project/ProjectSourceCode/Api_Implementation/output/steamboat_daily_weather.csv')
# Set up SQL connection (adjust DB name and password)
engine = create_engine('mysql+pymysql://root:root@localhost:3306/weather_db')

# Insert into table
eldora_df.to_sql('eldora_weather', con=engine, if_exists='append', index=False)
winter_park_df.to_sql('winter_park_weather', con=engine, if_exists='append', index=False)
copper_df.to_sql('copper_weather', con=engine, if_exists='append', index=False)
steamboat_df.to_sql('steamboat_weather', con=engine, if_exists='append', index=False)
