# melville.wiki

A birthday present for Dad so we can find better wikipedia pages to read

## Install (TODO: make this less ratchet by using something like CodePipeline)
1. Follow these guides to [setup an AWS VPC](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Tutorials.WebServerDB.CreateVPC.html) and [EC2 + RDS instances](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Tutorials.WebServerDB.CreateVPC.html)
2. On the EC2 instanc3, install git and nvm, install node v10.15.3, and get around the fact that you need to be root to listen on low-numbered ports by following the steps [here](https://www.edureka.co/community/23346/unable-to-start-express-server-on-aws-instance)
3. run `npm start` while in the random-wiki directory

## Updating (TODO: make less janky, see above)
1. ssh into the EC2 instance
2. cd to the random-wiki dir
3. `git pull && npm install`
4. `killall node` # note that this will kill the website and no clients will connect
5. `nohup npm start &`

## TODO

- [ ] Set cookie for each user so we can keep track of their user id
- [ ] setup amazon RDS (create tables, schemas, and api key)
- [ ] add initializer page where user can upload pages they like and then from there we can seed the categories to search for randomness in
  - [] for each random page displayed remember which category we chose from, so then if the user doesn't like it we can remove that category from the seed category list 
  - [ ] add logic to break out of the search bubble, because with only the above implemented they will never leave the categories they initially entered
- [ ] add swipe support for quickly getting a new page when viewport = mobile