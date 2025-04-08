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
	"latitude": 39.9486,
	"longitude": -105.5639,
	"daily": ["temperature_2m_max", "temperature_2m_min", "snowfall_sum", "uv_index_max", "wind_speed_10m_max", "wind_gusts_10m_max"],
	"hourly": ["temperature_2m", "snow_depth", "wind_speed_10m", "snowfall", "precipitation_probability", "wind_speed_120m", "wind_speed_180m", "wind_speed_80m", "visibility"],
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

							# Process hourly data. The order of variables needs to be the same as requested.
hourly = response.Hourly()
hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
hourly_snow_depth = hourly.Variables(1).ValuesAsNumpy()
hourly_wind_speed_10m = hourly.Variables(2).ValuesAsNumpy()
hourly_snowfall = hourly.Variables(3).ValuesAsNumpy()
hourly_precipitation_probability = hourly.Variables(4).ValuesAsNumpy()
hourly_wind_speed_120m = hourly.Variables(5).ValuesAsNumpy()
hourly_wind_speed_180m = hourly.Variables(6).ValuesAsNumpy()
hourly_wind_speed_80m = hourly.Variables(7).ValuesAsNumpy()
hourly_visibility = hourly.Variables(8).ValuesAsNumpy()

hourly_data = {"date": pd.date_range(
	start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
	end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = hourly.Interval()),
	inclusive = "left"
)}

hourly_data["temperature_2m"] = hourly_temperature_2m
hourly_data["snow_depth"] = hourly_snow_depth
hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
hourly_data["snowfall"] = hourly_snowfall
hourly_data["precipitation_probability"] = hourly_precipitation_probability
hourly_data["wind_speed_120m"] = hourly_wind_speed_120m
hourly_data["wind_speed_180m"] = hourly_wind_speed_180m
hourly_data["wind_speed_80m"] = hourly_wind_speed_80m
hourly_data["visibility"] = hourly_visibility

hourly_dataframe = pd.DataFrame(data = hourly_data)
print(hourly_dataframe)

							# Process daily data. The order of variables needs to be the same as requested.
daily = response.Daily()
daily_temperature_2m_max = daily.Variables(0).ValuesAsNumpy()
daily_temperature_2m_min = daily.Variables(1).ValuesAsNumpy()
daily_snowfall_sum = daily.Variables(2).ValuesAsNumpy()
daily_uv_index_max = daily.Variables(3).ValuesAsNumpy()
daily_wind_speed_10m_max = daily.Variables(4).ValuesAsNumpy()
daily_wind_gusts_10m_max = daily.Variables(5).ValuesAsNumpy()

daily_data = {"date": pd.date_range(
	start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
	end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = daily.Interval()),
	inclusive = "left"
)}

daily_data["temperature_2m_max"] = daily_temperature_2m_max
daily_data["temperature_2m_min"] = daily_temperature_2m_min
daily_data["snowfall_sum"] = daily_snowfall_sum
daily_data["uv_index_max"] = daily_uv_index_max
daily_data["wind_speed_10m_max"] = daily_wind_speed_10m_max
daily_data["wind_gusts_10m_max"] = daily_wind_gusts_10m_max

daily_dataframe = pd.DataFrame(data = daily_data)
print(daily_dataframe)

folder_path = os.path.join("CSCI3308-014-02-Group-Project", "ProjectSourceCode", "Api_Implementation", "output")
hourly_dataframe.to_csv(folder_path + "hourly_weather.csv", index=False)
daily_dataframe.to_csv(folder_path + "daily_weather.csv", index=False)

