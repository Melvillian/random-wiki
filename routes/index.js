var express = require('express');
var _ = require('lodash');
var router = express.Router();
var wiki = require('wikijs').default;
const db = require('../db/index');

/* GET home wikipage. */
router.get('/', async function (req, res, next) {
  try {
    if (!_.isUndefined(req.cookies.user_cookie)) {
      const category = await db.getRandomCategoryForUser(req.cookies.user_cookie);
      const randomPage = await getRandomPageInCategory(category);

      res.render('wikipage', wikipagePugOptions(randomPage));
    } else {
      // this is a first time user, redirect them to the first page
      res.render('index');
    }
  } catch (error) {
    return next(error);
  }
});

/* POST register new user */
router.post('/register', async (req, res, next) => {
  try {
    const wikipage = req.body.wikipage; // a wikipedia wikipage, like "Winston Churchill"

    // fetch wikipage and extract categories.
    const categories = await getCategoriesForPage(wikipage);
    if (_.isEmpty(categories)) {
      throw new Error(`could not find an interesting enough wikipedia entry for ${wikipage}`);
    }
    const cookie = generateSessionCookie();

    await db.newUserSignup(cookie, categories);

    res.cookie("user_cookie", cookie, { maxAge: 364 * 24 * 60 * 1000 }); // 1 year

    res.redirect('/');
  } catch (error) {
    return next(error)
  }
});

const wikipagePugOptions = (wikipage) => {
  console.log(`randomPage: ${wikipage}`);
  const topic = _.replace(wikipage, ' ', '_'); // wikipedia pages use underscores instead of spaces

  return {
    url: `https://en.wikipedia.org/wiki/${topic}`
  }
}

// We want to keep our potential categories to choose from interesting, and so we must remove any
// uninteresting categories we may come across
const unwantedCategoryPrefixes = [
  "Wikipedia",
  "Articles",
  "All article disambiguation pages",
  "All disambiguation pages",
  "Disambiguation pages",
  "Disambiguation pages with short description",
  "Place name disambiguation pages"
]

/**
 * fetch a wikipage's categories and filter down unwanted categories
 * @param {String} wikipage
 */
const getCategoriesForPage = async (wikipageName) => {
  const wikipage = await wikiWithHeaders().page(wikipageName);
  const rawCategories = await wikipage.categories();
  return rawCategories
    // remove wikipedia's meta categories we don't like.
    // we do .substring(9) because every raw category from wiki looks like "Category:1874 births",
    // so we need to cut out the prefix to compare at the beginning
    .filter((category) => unwantedCategoryPrefixes.every((unwantedCategory) => !_.startsWith(category.substring(9), unwantedCategory)));
}

// TODO do this so the session cannot be guessed, because right now it's easy to guess
const generateSessionCookie = () => {
  return new Date().getTime().toString();
}

// the mediawiki demands we pass a User-Agent in, probably for rate-limiting reasons
const wikiWithHeaders = () => {
  return wiki({ headers: { 'User-Agent': 'melville_wiki_script (http://melville.wiki; amelville93@yahoo.com) wiki.js' } });
}

// TODO make this cache the wiki categories in the DB so we don't have to hit wikipedia's API for that category in the future
// Return a random wikipage from a given category
const getRandomPageInCategory = async (category) => {
  // check if we've already inserted this category's pages in our DB, and if so grab from there.
  // otherwise fetch them using wikijs
  if ((await db.categoryExists(category))) {
    console.log(`category ${category} exists already in DB`);
    const randomPage = await db.getRandomPageInCategory(category);
    return randomPage;
  }

  // looks like we haven't seen this category or its page before.
  // fetch them from wikipedia and save them in the DB for quicker lookup next time
  console.log(`category ${category} must be fetched from wikipedia`);

  const allPages = await wikiWithHeaders().pagesInCategory(category);
  await db.insertPages(allPages, category);

  return _.sample(allPages);
};

module.exports = router;
