var express = require('express');
var _ = require('lodash');
var router = express.Router();
var wiki = require('wikijs').default;

/* GET home page. */
// TODO generic error handling
router.get('/', function (req, res, next) {

  if (req.cookies.melville_wiki_cookie) {
    // 1. use cookie to get user.
    // 2. search categories and choose a random one
    // 3. get the html for a random wiki page in that category
    // 4. write that back to the user
  } else {
    res.render('index', { title: 'Happy Birthday Dad!' });
  }
});

/* POST register new user */
// TODO generic error handling
router.post('/register', async function (req, res, next) {
  try {
    const wikitopic = req.body.wikitopic; // a wikipedia topic, like "Windston Churchill"

    // fetch wikitopic and extract categories.
    const categories = await getTopicCategories(wikitopic);
    if (_.isEmpty(categories)) {
      throw new Error(`could not find an interesting enough wikipedia entry for ${wikitopic}`);
    }

    res.redirect('/');
  } catch (error) {
    return next(error)
  }
});

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
 * fetch a wikitopic's categories and filter down unwanted categories
 * @param {String} wikitopic
 */
const getTopicCategories = async (wikitopic) => {
  const page = await wiki({ headers: { 'User-Agent': 'my-script-name (https://my-script-link; my@email) wiki.js' } }).page(wikitopic);
  const rawCategories = await page.categories();
  return rawCategories
    // every raw category from wiki looks like "Category:1874 births", so we need to cut out the prefix
    .map((category) => category.substring(9))
    // remove wikipedia's meta categories we don't like
    .filter((category) => unwantedCategoryPrefixes.every((unwantedCategory) => !_.startsWith(category, unwantedCategory)));
}

// TODO do this so the session cannot be guesses
const generateSessionCookie = () => {
  return new Date().getTime().toString();
}

module.exports = router;
