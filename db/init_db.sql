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
    category_name text UNIQUE NOT NULL,
    are_pages_fetched boolean
);
CREATE INDEX category_id_are_pages_fetched_idx ON category (id, are_pages_fetched);

CREATE TABLE IF NOT EXISTS pages (
    id serial PRIMARY KEY,
    page_name text UNIQUE NOT NULL,
    category_id int REFERENCES category (id)
);
CREATE INDEX category_id_idx ON pages (category_id);

CREATE TABLE IF NOT EXISTS user_profile_category (
    user_id int REFERENCES user_profile (id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_id int REFERENCES category (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT user_category_pkey  PRIMARY KEY (user_id, category_id)
);
