const sqlDefault = process.global.sql;

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

const insertCategories = async (categories, sql = sqlDefault) => {
    // we need our categories in the format our postgres client expects them to be in
    const records = categories.map((category_name) => {
        return { category_name }
    });

    let newCategoryIds = (await sql`
        insert into category ${
            sql(records, 'category_name')
        }
        returning id
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

module.exports = {
    newUserSignup
}