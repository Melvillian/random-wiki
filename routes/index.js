var express = require('express');
var _ = require('lodash');
const validUrl = require('valid-url');
var router = express.Router();
var wiki = require('wikijs').default;

/* GET home page. */
// TODO generic error handling
router.get('/', function(req, res, next) {
  // Cookies that have not been signed
  console.log('Cookies: ', req.cookies)
  console.log(JSON.stringify(req.body));

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
router.post('/register', async function(req, res, next) {
  try {
    const wikisite = req.body.wikisite;
    if (!validUrl.isHttpUri(wikisite) && !validUrl.isHttpsUri(wikisite)) {
      throw new Error(`need a valid URL for req.body.wikisite: ${wikisite}`);
    }

    // fetch wikipage and extract categories
    const categories = await getPageCategories("Winston Churchill");
    res.redirect('/');
  } catch (error) {
    return next(error)
  }
});

const getPageCategories = async (pageName) => {
  const page = await wiki({ headers: { 'User-Agent': 'my-script-name (https://my-script-link; my@email) wiki.js' } }).page(pageName);
  const rawCategories = await page.categories();
  return rawCategories
    // every raw category from wiki looks like "Category:1874 births", so we need to cut out the prefix
    .map((category) => category.substring(9))
     // remove wikipedia's meta categories we don't like
    .filter((category) => !_.startsWith(category, "Wikipedia") && !_.startsWith(category, "Articles"));
}

// TODO do this so the session cannot be guesses
const generateSessionCookie = () => {
  return new Date().getTime().toString();
}

module.exports = router;
