const sqlDefault = process.global.sql;
const _ = require('lodash');

// postgres blows up if you try to insert more than this number of rows
const MAX_PG_INSERT_SIZE = Math.pow(2, 16) - 1;

const insertUser = async (cookie, username, passwd, sql = sqlDefault) => {
    const [newUser] = await sql`
        insert into user_profile (
            cookie
        ) VALUES (
            ${cookie}
        )

        returning *
    `;

    console.log(`inserted user: ${JSON.stringify(newUser)}`);
    return newUser;
};

// TODO handle problems with UNIQUE indexes
const insertCategories = async (categories, sql = sqlDefault) => {
    // we need our categories in the format our postgres client expects them to be in
    const records = categories.map((category_name) => {
        return { category_name }
    });

    // TODO do not use the DO UPDATE hack for conflicts,
    // see https://stackoverflow.com/questions/34708509/how-to-use-returning-with-on-conflict-in-postgresql/42217872#42217872
    // and https://dba.stackexchange.com/questions/129522/how-to-get-the-id-of-the-conflicting-row-in-upsert
    let newCategoryIds = (await sql`
        insert into category ${
            sql(records, 'category_name')
        }
        ON CONFLICT (category_name) DO UPDATE
        SET category_name=EXCLUDED.category_name
        RETURNING id
    `).map((obj) => obj.id);

    console.log(`inserted category ids: ${JSON.stringify(newCategoryIds)}`);
    return newCategoryIds;
};

const insertUserAndCategories = async (userId, categoryIds, sql = sqlDefault) => {
    const records = categoryIds.map(category => {
        return {
            user_id: userId,
            category_id: category,
        };
    });
    const newUsersAndCategories = await sql`
        insert into user_profile_category ${
            sql(records, 'user_id', 'category_id')
        }
        returning *
    `

    console.log(`inserted user_profile_categories: ${JSON.stringify(newUsersAndCategories)}`);
    return newUsersAndCategories;
};

// all inside a transaction, insertUser, insertCategories, insertUserAndCategories
const newUserSignup = async (cookie, categories, username, passwd) => {
    return sqlDefault.begin(async (sql) => {
        const newUser = await insertUser(cookie, undefined, undefined, sql);
        const categoryIds = await insertCategories(categories, sql);
        await insertUserAndCategories(newUser.id, categoryIds, sql);
        return true;
    });
};

const getRandomPrefetchedCategoryForUser = async (cookie) => {
    const records = await sqlDefault`
        SELECT category.category_name FROM user_profile
        INNER JOIN user_profile_category ON user_profile.id = user_profile_category.user_id
        INNER JOIN category ON category.id = user_profile_category.category_id AND category.are_pages_fetched = TRUE
        WHERE cookie='${cookie}'
        ORDER BY RANDOM()
        LIMIT 1
    `
    const categories = records.map((record) => record.category_name);
    const category = categories[0];
    console.log(`retreived random prefetched category ${category} for user with cookie ${cookie}`);
    return category;
};

const getRandomCategoryForUser = async (cookie) => {
    const records = await sqlDefault`
        SELECT category.category_name FROM user_profile
        INNER JOIN user_profile_category ON user_profile.id = user_profile_category.user_id
        INNER JOIN category ON category.id = user_profile_category.category_id
        WHERE cookie=${cookie}
        ORDER BY RANDOM()
        LIMIT 1
    `
    const categories = records.map((record) => record.category_name);
    const category = categories[0];
    console.log(`retreived random category ${category} for user with cookie ${cookie}`);
    return category;
};

const getRandomPageInCategory = async (category) => {
    const records = await sqlDefault`
        SELECT pages.page_name FROM category
        INNER JOIN pages ON category.id = pages.category_id
        where category.category_name = ${category}
        ORDER BY RANDOM()
        LIMIT 1
    `

    const pages = records.map((record) => record.page_name);
    const page = pages[0];
    console.log(`retreived random page ${page}`);
    return page;
}

// TODO do not use the DO UPDATE hack for conflicts,
// see https://stackoverflow.com/questions/34708509/how-to-use-returning-with-on-conflict-in-postgresql/42217872#42217872
// and https://dba.stackexchange.com/questions/129522/how-to-get-the-id-of-the-conflicting-row-in-upsert
const insertPages = async (allPages, category) => {
    const [categoryRecord] = await sqlDefault`
        select id from category
        where category.category_name = ${category}
    `

    const records = allPages.map((page) => {
        return {
            page_name: page,
            category_id: categoryRecord.id
        }
    })

    const chunkedRecords = _.chunk(records, MAX_PG_INSERT_SIZE);

    for (let chunk of chunkedRecords) {
        await sqlDefault`
            insert into pages ${
                sqlDefault(chunk, 'page_name', 'category_id')
            }
            ON CONFLICT (page_name) DO UPDATE
            SET page_name=EXCLUDED.page_name
        `
    }

    await sqlDefault`
        update category
        SET are_pages_fetched = TRUE
        WHERE category_name = ${category}
    `
}

const categoryExists = async (category) => {
    const [categoryRecord] = await sqlDefault`
        select pages.category_id from category
        INNER JOIN pages ON category.id = pages.category_id
        where category.category_name = ${category}
        LIMIT 1
    `

    console.log(`categoryExists: ${JSON.stringify(categoryRecord)}`);

    return !_.isUndefined(categoryRecord);
}

module.exports = {
    newUserSignup,
    getRandomCategoryForUser,
    getRandomPrefetchedCategoryForUser,
    getRandomPageInCategory,
    insertPages,
    categoryExists
}