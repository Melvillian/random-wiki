var express = require('express');
var _ = require('lodash');
var router = express.Router();
var wiki = require('wikijs').default;
const db = require('../db/index');

/* GET home wikipage. */
// TODO generic error handling
router.get('/', function (req, res, next) {

  if (!_.isUndefined(req.cookies.user_cookie)) {
    // 1. use cookie to get user.
    // 2. search categories and choose a random one
    // 3. get the html for a random wiki wikipage in that category
    // 4. write that back to the user
    res.render('wikipage', { wikipage: "Winston_Churchill" })
  } else {
    res.render('index');
  }

});

/* POST register new user */
// TODO generic error handling
router.post('/register', async function (req, res, next) {
  try {
    const wikipage = req.body.wikipage; // a wikipedia wikipage, like "Winston Churchill"

    // fetch wikipage and extract categories.
    const categories = await getTopicCategories(wikipage);
    if (_.isEmpty(categories)) {
      throw new Error(`could not find an interesting enough wikipedia entry for ${wikipage}`);
    }
    const newCookie = generateSessionCookie();

    //const success = await db.newUserSignup(categories, newCookie);

    const category = categories[0];
    console.log(`category: ${category}`);
    const randomPage = await getRandomPageInCategory(category);

    //res.cookie("user_cookie", newCookie, { maxAge: 10000 });

    //res.redirect('/');
    res.render('wikipage', wikipagePugOptions(randomPage));
  } catch (error) {
    return next(error)
  }
});

const wikipagePugOptions = (wikipage) => {
  console.log(`randomPage: ${wikipage}`);
  const topic = _.replace(wikipage, ' ', '_'); // wikipedia pages use underscores instead of spaces

  return {
    url: `https://en.wikipedia.org/wiki/${topic}`,
    title: "testtest",
  }
}

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
const getTopicCategories = async (wikipageName) => {
  const wikipage = await wikiWithHeaders().page(wikipageName);
  const rawCategories = await wikipage.categories();
  return rawCategories
    // remove wikipedia's meta categories we don't like.
    // we do .substring(9) because every raw category from wiki looks like "Category:1874 births",
    // so we need to cut out the prefix
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
  const allCategories = await wikiWithHeaders().pagesInCategory(category);

  return _.sample(allCategories);
};

module.exports = router;
