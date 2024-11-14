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
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});
app.get('/test', (req, res) => {
  res.redirect('/login'); //this will call the /anotherRoute route in the API
});
  
app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.get('/register', (req, res) => {
  res.render('pages/register')
});


// Register
app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.pwd, 10);

  // To-DO: Insert username and hashed password into the 'users' table
  db.any(`insert into users(username, pwd) values($1, $2);`, [req.body.username, hash])
    .then(data => {
      res.status(200).json({
        message: "Success"
      });
      // res.redirect('/login');
    })
    .catch(error => {
      console.log(error);
      res.status(400).json({
        message: "Invalid input"
      });
      // res.redirect('/register');
    });
})


// app.post('/login', async (req, res) => {
//   const username = req.body.username;
//   const password = req.body.password;
//   const query = 'select * from users where users.username = $1 LIMIT 1';
//   const values = [username];

//   try{
//     console.log("Querying for user:", username);

//     const data = await db.one(query, values);

//     // Now we have the user data
//     const user = {
//       username: data.username,
//       password: data.password // Make sure this is the hashed password from the database
//     };
   
//     const match = await bcrypt.compare(password, user.password);

//     if(!match)
//     {
//       return res.render('pages/login', { message: 'Incorrect username or password' });
//     }

//     req.session.user = user;
//     req.session.save();

//     return res.redirect('/discover');
//   } catch(error){
//     console.error("Login error:", error);
//     res.status(500).send("Error Test");
//   }

// });

// const auth = (req, res, next) => {
//   if (!req.session.user) {
//     // Redirect to login if no user in session
//     return res.redirect('/login');
//   }
//   next();
// };

// // Apply auth middleware to /discover route
// app.use('/discover', auth);


// app.get('/logout', (req, res) => {
//   req.session.destroy();
//   res.render('pages/logout');
// });

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');