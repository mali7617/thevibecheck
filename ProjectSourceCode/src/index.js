const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });


app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
      secret: process.env.SESSION_SECRET,
      saveUninitialized: false,
      resave: false,
  })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

/*_________API ROUTES_________*/
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});
  
app.get('/login', (req, res) => {
  res.render('pages/login')
});

app.get('/register', (req, res) => {
  res.render('pages/register');;
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout');
});

app.get('/test', (req, res) => {
  res.redirect('/login'); 
  res.status(302);
});

// Register
app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = 'INSERT INTO users (username, password) VALUES ($1, $2);';
  db.any(query, [
    req.body.username, 
    hash
  ]).then(data => {
      res.render('pages/login', {
        message: "Registered Successfully"
      });
      // res.status(200).json({
      //   message: "Success"
      // });
    })
    .catch(error => {
      res.redirect('/register');
      // res.status(400).json({
      //   message: "Invalid input"
      // });
    });
})

// Login POST
app.post('/login', async (req, res) =>{
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = 'select * from users where username = $1 limit 1;';
    db.any(query, req.body.username).then(async user => {
        user = user[0];

        // check if password from request matches with password in DB
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) {
          res.render('pages/login', {message: `Incorrect username or password.`, error: true});
        } else {
            req.session.user = user;
            req.session.save();
            res.redirect('/logout')
        }
    }).catch(err => {
      console.log(err);
      res.redirect('/register');
    });
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).send('Not authenticated');
  }
  next();
};

app.use('/profile', auth);

app.get('/profile', (req, res) => {
  try {
    res.status(200).json({
      username: req.session.user.username,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).send('Internal Server Error');
  }
});



module.exports = app.listen(3000);
console.log('Server is listening on port 3000');