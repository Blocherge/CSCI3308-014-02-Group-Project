#pip install openmeteo-requests
#pip install requests-cache retry-requests numpy pandas

import openmeteo_requests
import os
import requests_cache
import pandas as pd
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": 39.8916537,
	"longitude": -105.7630624,
	"daily": ["temperature_2m_max", "temperature_2m_min", "wind_speed_10m_max", "snowfall_sum", "uv_index_max", "weather_code"],
	"timezone": "America/Denver",
	"wind_speed_unit": "mph",
	"temperature_unit": "fahrenheit"
}
responses = openmeteo.weather_api(url, params=params)

# Process first location. Add a for-loop for multiple locations or weather models
response = responses[0]
print(f"Coordinates {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation {response.Elevation()} m asl")
print(f"Timezone {response.Timezone()}{response.TimezoneAbbreviation()}")
print(f"Timezone difference to GMT+0 {response.UtcOffsetSeconds()} s")


							# Process daily data. The order of variables needs to be the same as requested.
daily = response.Daily()
daily_temperature_2m_max = daily.Variables(0).ValuesAsNumpy()
daily_temperature_2m_min = daily.Variables(1).ValuesAsNumpy()
daily_snowfall_sum = daily.Variables(2).ValuesAsNumpy()
daily_uv_index_max = daily.Variables(3).ValuesAsNumpy()
daily_wind_speed_10m_max = daily.Variables(4).ValuesAsNumpy()
daily_weather_code = daily.Variables(5).ValuesAsNumpy()

daily_data = {"date": pd.date_range(
	start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
	end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = daily.Interval()),
	inclusive = "left"
)}

daily_data["temperature_2m_max"] = daily_temperature_2m_max
daily_data["temperature_2m_min"] = daily_temperature_2m_min
daily_data["wind_speed_10m_max"] = daily_wind_speed_10m_max
daily_data["snowfall_sum"] = daily_snowfall_sum
daily_data["uv_index_max"] = daily_uv_index_max
daily_data["weather_code"] = daily_weather_code

daily_dataframe = pd.DataFrame(data = daily_data)
print(daily_dataframe)

#hour_folder_path = os.path.join("CSCI3308-014-02-Group-Project", "ProjectSourceCode", "Api_Implementation", "output","hourly_weather.csv")
#daily_folder_path = os.path.join("CSCI3308-014-02-Group-Project", "ProjectSourceCode", "Api_Implementation", "output","daily_weather.csv")

#copy full path to folder for your enviroment if above not working
daily_dataframe.to_csv("/Users/xavierrudnick/Desktop/softDev/CSCI3308-014-02-Group-Project/ProjectSourceCode/Api_Implementation/output/winterpark_daily_weather.csv", index=False)

