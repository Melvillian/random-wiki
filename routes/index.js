var express = require('express');
var _ = require('lodash');
var router = express.Router();
var wiki = require('wikijs').default;

/* GET home page. */
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
router.post('/register', function(req, res, next) {
  if (!!req.body.wikisite) { // TODO sanitize the URL and return error if it's incorrect
    // fetch wikipage and extract categories
    getPageCategories("Winston Churchill")
    .then((categories) => {
      console.log(JSON.stringify(categories, null, 2));
      res.render('wikipage', { title: 'A Random Wiki' });
    })
    .catch(next);
  } else {
    // TODO fix this
    console.log(`barf: ${req.body}`);
  }
});

const getPageCategories = (pageName) => {
  return wiki({ headers: { 'User-Agent': 'my-script-name (https://my-script-link; my@email) wiki.js' } })
    .page(pageName)
    .then((page) => page.categories())
    .then((rawCategories) => {
      return rawCategories
      .map((category) => category.substring(9)) // every raw category from wiki looks like "Category:1874 births", so we need to cut out the prefix
      .filter((category) => !_.startsWith(category, "Wikipedia") && !_.startsWith(category, "Articles")); // remove wikipedia's meta categories we don't like
    });
}

// TODO do this so the session cannot be guesses
const generateSessionCookie = () => {
  return new Date().getTime().toString();
}

module.exports = router;
