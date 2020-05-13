-- DROP TABLE user_profile_category;
-- DROP TABLE user_profile;
-- DROP TABLE category;

CREATE TABLE IF NOT EXISTS user_profile (
    id serial PRIMARY KEY,
    cookie text UNIQUE NOT NULL,
    username varchar (50) UNIQUE,
    passwd varchar (50),
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS category (
    id serial PRIMARY KEY,
    name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile_category (
    user_id int REFERENCES user_profile (id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_id int REFERENCES category (id) ON UPDATE CASCADE,
    CONSTRAINT user_category_pkey  PRIMARY KEY (user_id, category_id)
);

-- insert into category (
--     name
--   ) values (
--     'Winston Churchill'
--   );

-- insert into user_profile (
--     cookie
--   ) values (
--     'floop'
--   );

-- insert into user_profile_category (
--     user_id, category_id
--     ) values (
--         1, 1
--     );