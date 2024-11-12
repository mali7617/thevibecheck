CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    pwd VARCHAR(60) NOT NULL,
    user_type VARCHAR(25)
);

