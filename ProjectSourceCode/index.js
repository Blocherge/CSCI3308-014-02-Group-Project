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

        res.redirect('/login'); 

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
        res.redirect('/home'); // ORIGINALLY WAS '/discover'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.render('pages/login', { message: 'Incorrect username or password' });
    }
});

app.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    res.render('pages/logout', {message: 'logged out successfully'});
  });
});

//main page data
app.get('/home', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails'
        const response = await db.query(query);

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trails.name,
            trail_id: trails.id,
            trail_image: trails.trail_image,
            avg_rating: trails.avg_rating
        }));

        res.render('pages/home', { trails });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/home', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

app.get('/copper', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails WHERE name = $1 LIMIT 1'
        const response = await db.query(query, ['copper']);

        const query_2 = 'SELECT * FROM copper_reviews'
        const response_2 = await db.query(query_2);
        
        const query_3 = 'SELECT * FROM copper_lifts'
        const response_3 = await db.query(query_3);

        const query_4 = 'SELECT * FROM copper_runs'
        const response_4 = await db.query(query_4);

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trail.name,
            trail_id: trail.id,
            trail_image: trail.trail_image,
            avg_rating: trail.avg_rating,
            description: trail.description,
            location: trail.location
        }));

        const reviewsData = response_2.data|| [];

        const copper_reviews = reviewsData.map(reviewsData => ({
            username: reviews.username,
            title: reviews.title,
            rating: reviews.rating,
            business: reviews.business,
            text: reviews.text,
            date: reviews.date
        }));

        const liftsData = response_3.data|| [];

        const copper_lifts = liftsData.map(liftsData => ({
            name: lifts.name,
            open: lifts.open,
            type: lifts.type,
        }));

        const runsData = response_4.data|| [];

        const copper_runs = runsData.map(runsData => ({
            name: runs.name,
            open_closed: runs.open_closed,
            groomed: runs.groomed,
            difficulty: runs.difficulty
        }));

        res.render('pages/copper', { trail: trails[0] , copper_reviews , copper_lifts , copper_runs });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/copper', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/copper_review', auth, async (req, res) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear(); // Get the full year
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Get the month (zero-based, so add 1) and ensure two digits
    const day = String(currentDate.getDate()).padStart(2, '0'); // Get the day and ensure two digits
    
    const formattedDate = `${year}-${month}-${day}`; // Format as YYYY-MM-DD    

    const { username = req.session.user, text, rating, business, title, date = formattedDate} = req.body;

    console.log("DATA:", username, text, rating, business, title, date);

    if (!username || rating == undefined || !business || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const query = await db.none('INSERT INTO copper_reviews (username, rating, business, title, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, rating, business, title, text, date]);

        res.status(200);
        res.render('pages/review_left');
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/eldora', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails WHERE name = $1 LIMIT 1'
        const response = await db.query(query, ['eldora']);

        const query_2 = 'SELECT * FROM eldora_reviews'
        const response_2 = await db.query(query_2);
        
        const query_3 = 'SELECT * FROM eldora_lifts'
        const response_3 = await db.query(query_3);

        const query_4 = 'SELECT * FROM eldora_runs'
        const response_4 = await db.query(query_4);

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trail.name,
            trail_id: trail.id,
            trail_image: trail.trail_image,
            avg_rating: trail.avg_rating,
            description: trail.description,
            location: trail.location
        }));

        const reviewsData = response_2.data|| [];

        const eldora_reviews = reviewsData.map(reviewsData => ({
            username: reviews.username,
            title: reviews.title,
            rating: reviews.rating,
            business: reviews.business,
            text: reviews.text,
            date: reviews.date
        }));

        const liftsData = response_3.data|| [];

        const eldora_lifts = liftsData.map(liftsData => ({
            name: lifts.name,
            open: lifts.open,
            type: lifts.type,
        }));

        const runsData = response_4.data|| [];

        const eldora_runs = runsData.map(runsData => ({
            name: runs.name,
            open_closed: runs.open_closed,
            groomed: runs.groomed,
            difficulty: runs.difficulty
        }));

        res.render('pages/eldora', { trail: trails[0] , eldora_reviews , eldora_lifts , eldora_runs });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/eldora', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/eldora_review', auth, async (req, res) => {
    const { username, text, rating, business, title, date} = req.body;

    console.log("RATING", rating)

    if (!username || rating == undefined || !business || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const query = await t.none('INSERT INTO edlora_reviews (username, title, rating, business, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, text, rating, business, title, date]);

        res.status(200);
        res.render('pages/review_left');
    } catch {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/steamboat', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails WHERE name = $1 LIMIT 1'
        const response = await db.query(query, ['steambooat']);

        const query_2 = 'SELECT * FROM steamboat_reviews'
        const response_2 = await db.query(query_2);
        
        const query_3 = 'SELECT * FROM steamboat_lifts'
        const response_3 = await db.query(query_3);

        const query_4 = 'SELECT * FROM steamboat_runs'
        const response_4 = await db.query(query_4);

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trail.name,
            trail_id: trail.id,
            trail_image: trail.trail_image,
            avg_rating: trail.avg_rating,
            description: trail.description,
            location: trail.location
        }));

        const reviewsData = response_2.data|| [];

        const steamboat_reviews = reviewsData.map(reviewsData => ({
            username: reviews.username,
            title: reviews.title,
            rating: reviews.rating,
            business: reviews.business,
            text: reviews.text,
            date: reviews.date
        }));

        const liftsData = response_3.data|| [];

        const steamboat_lifts = liftsData.map(liftsData => ({
            name: lifts.name,
            open: lifts.open,
            type: lifts.type,
        }));

        const runsData = response_4.data|| [];

        const steamboat_runs = runsData.map(runsData => ({
            name: runs.name,
            open_closed: runs.open_closed,
            groomed: runs.groomed,
            difficulty: runs.difficulty
        }));

        res.render('pages/steamboat', { trail: trails[0] , steamboat_reviews , steamboat_lifts , steamboat_runs });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/steamboat', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/steamboat_review', auth, async (req, res) => {
    const { username, text, rating, business, title, date} = req.body;

    console.log("RATING", rating)

    if (!username || rating == undefined || !business || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const query = await t.none('INSERT INTO steamboat_reviews (username, title, rating, business, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, text, rating, business, title, date]);

        res.status(200);
        res.render('pages/review_left');
    } catch {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/winter_park', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails WHERE name = $1 LIMIT 1'
        const response = await db.query(query, ['winter park']);

        const query_2 = 'SELECT * FROM winter_park_reviews'
        const response_2 = await db.query(query_2);
        
        const query_3 = 'SELECT * FROM winter_park_lifts'
        const response_3 = await db.query(query_3);

        const query_4 = 'SELECT * FROM winter_park_runs'
        const response_4 = await db.query(query_4);

        const trailsData = response.data|| [];

        const trails = trailsData.map(trailsData => ({
            name: trail.name,
            trail_id: trail.id,
            trail_image: trail.trail_image,
            avg_rating: trail.avg_rating,
            description: trail.description,
            location: trail.location
        }));

        const reviewsData = response_2.data|| [];

        const winter_park_reviews = reviewsData.map(reviewsData => ({
            username: reviews.username,
            title: reviews.title,
            rating: reviews.rating,
            business: reviews.business,
            text: reviews.text,
            date: reviews.date
        }));

        const liftsData = response_3.data|| [];

        const winter_park_lifts = liftsData.map(liftsData => ({
            name: lifts.name,
            open: lifts.open,
            type: lifts.type,
        }));

        const runsData = response_4.data|| [];

        const winter_park_runs = runsData.map(runsData => ({
            name: runs.name,
            open_closed: runs.open_closed,
            groomed: runs.groomed,
            difficulty: runs.difficulty
        }));

        res.render('pages/winter_park', { trail: trails[0], winter_park_reviews , winter_park_lifts , winter_park_runs });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/winter_park', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/winter_park_review', auth, async (req, res) => {
    const { username, text, rating, business, title, date} = req.body;

    console.log("RATING", rating)

    if (!username || rating == undefined || !business || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const query = await t.none('INSERT INTO winter_park_reviews (username, title, rating, business, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, text, rating, business, title, date]);

        res.status(200);
        res.render('pages/review_left');
    } catch {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');