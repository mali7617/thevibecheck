CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    pwd VARCHAR(60) NOT NULL,
    user_type VARCHAR(25)
);

create table moods(
    mood_id serial primary key,
    mood_name varchar(25)
);

create table locations(
    location_id serial primary key,
    location_name varchar(50),
);

create table moods_to_locations(
    mood_id int not null references moods(mood_id),
    location_id int not null references locations(location_id)
);

create table reviews{
    review_id serial primary key,
    user_id int references users(user_id),
    location_id int references locations(location_id),
    mood_id int references moods(mood_id),
    rating int,
    review varchar(250)
}

