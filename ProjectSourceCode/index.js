//dependencies the same as lab 8
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session'); 
const bcrypt = require('bcryptjs'); 
const axios = require('axios');

//hbs build
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

//db config will have to be updated when database is actually built
// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };
  
  const db = pgp(dbConfig);
  
  // test your database
  db.connect()
    .then(obj => {
      console.log('Database connection successful'); // you can view this message in the docker compose logs
      obj.done(); // success, release the connection;
    })
    .catch(error => {
      console.log('ERROR:', error.message || error);
    });

//final hbs requirements
// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('pages', path.join(__dirname, 'pages'));
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

const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};


//rough login/register API routes will have to be updated by group
app.get('/', (req, res) => {
    res.redirect('/login'); 
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';
        await db.query(query, [username, email, hashedPassword]);

        res.status(200).json({ status: 'success', message: 'success' });

    } catch (error) {
        console.error('Error inserting user:', error);

        if (error.code === '23505') { // Unique key violation
            return res.status(400).json({ status: 'error', message: 'Username or email already exists' });
        }

        res.status(500).json({ status: 'error', message: 'Error registering user. Try again.' });
    }
});

app.get('/login', (req, res) => {
    res.render('pages/login', { message: req.session.message });
    req.session.message = null; 
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('pages/login', { message: 'All fields are required' });
    }

    try {
        const query = await db.one('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);

        console.log("Query Result:", query);

        const match = await bcrypt.compare(password, query.password);

        if (!match) {
            return res.render('pages/login', { message: 'Incorrect username or password.' });
        }

        req.session.user = query.username;
        req.session.save(() => {
            res.redirect('/trail'); // ORIGINALLY WAS '/discover'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.render('pages/login', { message: 'Incorrect username or password' });
    }
});

//redirecting the login to trails TEMPORARY
app.get('/trail', (req, res) => {
    res.render('pages/trail', { message: req.session.message });
});


//main page data
app.get('/home', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails'
        const response = await db.query();

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trails.name,
            trail_id: trails.id,
            trail_image: trails.trail_image,
            avg_rating: trails.avg_rating
        }));

        res.render('pages/discover', { trails });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('trails', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.get('/trail', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails WHERE trail_id = $1 LIMIT 1'
        const response = await db.query([trail_id]);

        const query_2 = 'SELECT * FROM reviews RIGHT JOIN reviews_to_trails ON trail_id = $1'
        const response_2 = await db.query_2([trail_id]);

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trails.name,
            trail_id: trails.id,
            trail_image: trails.trail_image,
            avg_rating: trails.avg_rating,
            description: trails.description,
            location: trails.location
        }));

        const reviewsData = response_2.data|| [];

        const reviews = reviewsData.map(reviewsData => ({
            username: reviews.username,
            title: reviews.title,
            rating: reviews.rating,
            business: reviews.business,
            text: reviews.text,
            date: reviews.date
        }));

        res.render('pages/trail', { trails }, { reviews });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('trails', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.put('/review', auth, async (req, res) => {
    try {
        const { username, text, rating, business, title, date} = req.body;
        
        const query = await t.none('INSERT INTO reviews (username, title, rating, business, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, text, rating, business, title, date]);

        res.render('pages/review_left');
    } catch {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');