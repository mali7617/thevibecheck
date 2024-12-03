CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    pwd VARCHAR(60) NOT NULL,
    user_type VARCHAR(25)
);

CREATE TABLE moods (
    mood_id SERIAL PRIMARY KEY,
    mood_name VARCHAR(25)
);

CREATE TABLE  locations (
    location_id SERIAL PRIMARY KEY,
    location_name VARCHAR(50)
);

CREATE TABLE  moods_to_locations (
    mood_id INT NOT NULL REFERENCES moods(mood_id),
    location_id INT NOT NULL REFERENCES locations(location_id),
    PRIMARY KEY (mood_id, location_id)
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    location_id INT REFERENCES locations(location_id),
    mood_id INT REFERENCES moods(mood_id),
    rating INT,
    review VARCHAR(250)
);
