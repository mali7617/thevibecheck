-- CREATE TABLE IF NOT EXISTS USERS (
--     user_id SERIAL PRIMARY KEY,
--     username VARCHAR(50) NOT NULL,
--     pwd VARCHAR(60) NOT NULL,
--     user_type VARCHAR(25)
-- );

create table if not exists users (
    username varchar(50) primary key,
    password char(60) not null
)