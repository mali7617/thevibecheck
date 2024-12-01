create table users (
    user_id SERIAL primary key,
    username VARCHAR(50) not null unique,
    pwd VARCHAR(60) not null,
    user_type VARCHAR(25)
);

create table moods(
    mood_id serial primary key,
    mood_name varchar(25) not null 
);

create table locations(
    location_id varchar(100) primary key,
    location_name varchar(50) not null
);

create table reviews(
    review_id serial primary key,
    user_id int references users(user_id),
    location_id varchar(100) references locations(location_id),
    mood_id int references moods(mood_id),
    rating int not null,
    review varchar(250) not null
);

