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
require('dotenv').config();

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

const dbConfig = {
host: process.env.POSTGRES_HOST,
port: process.env.POSTGRES_PORT, // the database port
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
  res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/login', (req, res) => {
  res.render('pages/login', { layout: 'main2' })
});

app.get('/register', (req, res) => {
  res.render('pages/register', { register: 1, layout: 'main2' });
});

app.get('/test', (req, res) => {
  res.redirect('/login');
  res.status(302);
});

app.get('/api/get-google-maps-key', async (req, res) => {
  const keyFetch = await res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
  return keyFetch;
});

app.get('/account', (req, res) => {
  res.render('pages/account', {
    username: req.session.user.username,
  });
});

app.get('/map', (req, res) => {
  res.render('pages/map');
});


// Register
app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.pwd, 10);
  const query = 'INSERT INTO users (username, pwd) VALUES ($1, $2);';
  db.any(query, [
    req.body.username,
    hash
  ]).then(data => {
    if (req.body.test) {
      res.status(200).json({
        message: "Success"
      });
    }
    else {
      res.redirect('/login');
    }
  })
    .catch(error => {
      if (req.body.test) {
        res.status(400).json({
          message: "Invalid input"
        });
      }
      else {
        res.render('pages/register', { message: `Invalid input or username already exists.`, error: true, layout: 'main2' });
      }
    });
})

// Login POST
app.post('/login', async (req, res) => {
  const hash = await bcrypt.hash(req.body.pwd, 10);
  const query = 'select * from users where username = $1 limit 1;';
  db.any(query, req.body.username).then(async user => {
    user = user[0];
    // check if password from request matches with password in DB
    const match = await bcrypt.compare(req.body.pwd, user.pwd);
    if (!match) {
      res.render('pages/login', { message: `Incorrect username or password.`, error: true, layout: 'main2' });
    } else {
      req.session.user = user;
      req.session.save();
      res.redirect('/map');
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

app.use(auth);

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

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.render('pages/logout', { layout: 'main2' });
});

app.get('/api/get-google-maps-key', async (req, res) => {
  require('dotenv').config();
  const keyFetch = await res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
  return keyFetch;
});

app.get('/map', (req, res) => {
  if (req.session.user) {
    res.render('pages/map', { username: req.session.user.username });
  }
  else {
    res.redirect('login');
  }
});

// get Reviews and Rating for location
app.get('/mapInfo', (req, res) => {
  const location = req.query.location;
  const location_id = req.query.place_id;

  db.task('get-everything', task => {
    return task.batch([
      task.any(`select avg(rating) 
        from reviews inner join locations on reviews.location_id = locations.location_id
        where reviews.location_id = $1;`, [location_id]),
      task.any(`select username, mood_name, review, rating 
        from reviews inner join locations on reviews.location_id = locations.location_id
        inner join moods on reviews.mood_id = moods.mood_id
        inner join users on reviews.user_id = users.user_id
        where reviews.location_id = $1;`, [location_id]),
      task.any(`insert into locations (location_id, location_name)
        values ($1, $2) ON CONFLICT (location_id) DO NOTHING;`, [location_id, location])
    ]);
  })
    .then(data => {
      res.render('pages/mapReview',
        {
          rating: parseFloat(data[0][0].avg).toFixed(2),
          reviews: data[1].reverse(),
          location_name: location,
          location_id: location_id,
          username: req.session.user.username
        });
    })
    .catch(err => {
      console.log(err);
    });
});

// Add Review to Location
app.post('/addReview', (req, res) => {
  const location_id = req.body.place_id;
  const mood_id = req.body.mood;
  const rating = req.body.rating;
  const review = req.body.review;

  db.task('get-everything', task => {
    return task.batch([
      db.any(`insert into reviews (user_id, location_id, mood_id, rating, review)
    values ($1, $2, $3, $4, $5);`, [req.session.user.user_id, location_id, mood_id, rating, review]),
      db.any(`select * from locations where location_id = $1;`, [location_id])
    ]);
  })
    .then(data => {
      res.redirect('/mapInfo' + '?location=' + data[1][0].location_name + '&place_id=' + location_id);
    })
    .catch(err => {
      console.log(err);
    });
});

app.get('/account', (req, res) => {
  res.render('pages/account', {
    username: req.session.user.username,
  });
});



module.exports = app.listen(3000);
