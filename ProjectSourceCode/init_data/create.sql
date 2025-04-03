DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(50) UNIQUE KEY NOT NULL,
  email VARCHAR(50) UNIQUE KEY NOT NULL,
  password VARCHAR(60) NOT NULL
);

DROP TABLE IF EXISTS trails;
CREATE TABLE trails (
  trail_id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  avg_rating DECIMAL,
  image INT,
  description VARCHAR(500) NOT NULL,
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
    trail_id NOT NULL,
    review_id NOT NULL
);

DROP TABLE IF EXISTS users_to_reviews;
CREATE TABLE users_to_reviews (
    user_id NOT NULL,
    review_id NOT NULL,
);