CREATE DATABASE weather_db;
USE weather_db;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(60) NOT NULL
);

DROP TABLE IF EXISTS trails;
CREATE TABLE trails (
  trail_id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  avg_rating DECIMAL,
  image INT,
  description VARCHAR(500) NOT NULL
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(50) NOT NULL,
    rating DECIMAL NOT NULL,
    business DECIMAL NOT NULL,
    title VARCHAR(100) NOT NULL,
    text VARCHAR(500) NOT NULL,
    date VARCHAR(20)
);

DROP TABLE IF EXISTS trails_to_reviews;
CREATE TABLE trails_to_reviews (
    trail_id INT NOT NULL, -- needed a data type, threw in int for now
    review_id INT NOT NULL -- needed a data type, threw in int for now
);

DROP TABLE IF EXISTS users_to_reviews;
CREATE TABLE users_to_reviews (
    user_id INT NOT NULL, -- needed a data type, threw in int for now
    review_id INT NOT NULL -- needed a data type, threw in int for now
);

DROP TABLE IF EXISTS copper_lifts;
CREATE TABLE copper_lifts (
    lift_id SERIAL PRIMARY KEY NOT NULL,
    lift_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    lift_type VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS eldora_lifts;
CREATE TABLE eldora_lifts (
    lift_id SERIAL PRIMARY KEY NOT NULL,
    lift_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    lift_type VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS steamboat_lifts;
CREATE TABLE steamboat_lifts (
    lift_id SERIAL PRIMARY KEY NOT NULL,
    lift_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    lift_type VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS winter_park_lifts;
CREATE TABLE winter_park_lifts (
    lift_id SERIAL PRIMARY KEY NOT NULL,
    lift_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    lift_type VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS copper_runs;
CREATE TABLE copper_runs (
    run_id SERIAL PRIMARY KEY NOT NULL,
    run_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    groomed VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS eldora_runs;
CREATE TABLE eldora_runs (
    run_id SERIAL PRIMARY KEY NOT NULL,
    run_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    groomed VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS steamboat_runs;
CREATE TABLE steamboat_runs (
    run_id SERIAL PRIMARY KEY NOT NULL,
    run_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    groomed VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS winter_park_runs;
CREATE TABLE winter_park_runs (
    run_id SERIAL PRIMARY KEY NOT NULL,
    run_name VARCHAR(20) NOT NULL,
    open_closed VARCHAR(20) NOT NULL,
    groomed VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS eldora_weather;
CREATE TABLE eldora_weather (
    date DATE PRIMARY KEY NOT NULL,
    temperature_max INT NOT NULL,
    temperature_min INT NOT NULL,
    wind_speed_max INT NOT NULL,
    snowfall_sum FLOAT(2,2) NOT NULL,
    uv_index_max INT NOT NULL,
    weather_code INT NOT NULL
);

DROP TABLE IF EXISTS copper_weather;
CREATE TABLE copper_weather (
    date DATE PRIMARY KEY NOT NULL,
    temperature_max INT NOT NULL,
    temperature_min INT NOT NULL,
    wind_speed_max INT NOT NULL,
    snowfall_sum FLOAT(2,2) NOT NULL,
    uv_index_max INT NOT NULL,
    weather_code INT NOT NULL
);

DROP TABLE IF EXISTS winter_park_weather;
CREATE TABLE winter_park_weather (
    date DATE PRIMARY KEY NOT NULL,
    temperature_max INT NOT NULL,
    temperature_min INT NOT NULL,
    wind_speed_max INT NOT NULL,
    snowfall_sum FLOAT(2,2) NOT NULL,
    uv_index_max INT NOT NULL,
    weather_code INT NOT NULL
);

DROP TABLE IF EXISTS steamboat_weather;
CREATE TABLE steamboat_weather (
    date DATE PRIMARY KEY NOT NULL,
    temperature_max INT NOT NULL,
    temperature_min INT NOT NULL,
    wind_speed_max INT NOT NULL,
    snowfall_sum FLOAT(2,2) NOT NULL,
    uv_index_max INT NOT NULL,
    weather_code INT NOT NULL
);
