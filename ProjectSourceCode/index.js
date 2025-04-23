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
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        },
        difficultyIcon: function (difficulty) {
          switch (difficulty) {
            case '1':
            case 1:
              return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Ski_trail_rating_symbol-green_circle.svg/1200px-Ski_trail_rating_symbol-green_circle.svg.png';
            case '2':
            case 2:
              return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Ski_trail_rating_symbol-blue_square.svg/1200px-Ski_trail_rating_symbol-blue_square.svg.png';
            case '3':
            case 3:
              return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Ski_trail_rating_symbol-black_diamond.svg/1200px-Ski_trail_rating_symbol-black_diamond.svg.png';
            case '4':
            case 4:
            case '5':
            case 5:
              return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Ski_trail_rating_symbol-double_black_diamond.svg/1200px-Ski_trail_rating_symbol-double_black_diamond.svg.png';
            default:
                return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Ski_trail_rating_symbol-green_circle.svg/1200px-Ski_trail_rating_symbol-green_circle.svg.png';
          }
        },
        openClosed: function(openClosed) {
            switch (openClosed) {
                case 'True':
                case true:
                    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqYKWYDtF_ovKm10S7y-rxdOaY1cuj3JD-sQ&s'
                default:
                    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlhv-n_BHNP17Bxs9L9F74b1gwK1bu_CajhQ&s'
            }
        }
      }
});

hbs.handlebars.registerHelper('dashify', function(name) {
    return name.toLowerCase().replace(/\s+/g, '_');
  });

hbs.handlebars.registerHelper('round', function(value) {
    return Math.round(value);
});

//db config will have to be updated when database is actually built
// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432,
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

        const cp_wt = await db.query('SELECT * FROM copper_weather');

        const el_wt = await db.query('SELECT * FROM eldora_weather');

        const st_wt = await db.query('SELECT * FROM steamboat_weather');

        const wp_wt = await db.query('SELECT * FROM winter_park_weather');

        const trailsData = response.data|| [];

        const trails = trailsData.map(trail => ({
            name: trail.name,
            trail_id: trail.trail_id,
            avg_rating: trail.avg_rating,
            avg_busyness: trail.avg_busyness,
            description: trail.description
        }));

        const copper = trails[0] || {};
        const winter_park = trails[1] || {};
        const eldora = trails[2] || {};
        const steamboat = trails[3] || {};

        res.render('pages/home', { trails, copper, winter_park, eldora, steamboat });

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

        const query_5 = 'SELECT * FROM copper_weather'
        const response_5 = await db.query(query_5);

        const trailsData = response || []; // why were we doing response.data? Just response.

        const trails = trailsData.map(trailsData => ({ // for all of these consts you had written trails.name or reviews.username instead of reviewsData.username. With how you defined your mapping and variable that wouldn't have worked
            name: trailsData.name,
            trail_id: trailsData.id,
            avg_rating: trailsData.avg_rating,
            avg_busyness: trailsData.avg_busyness,
            description: trailsData.description,
            location: trailsData.location
        }));

        const reviewsData = response_2 || [];

        const copper_reviews = reviewsData.map(reviewsData => ({
            username: reviewsData.username,
            title: reviewsData.title,
            rating: reviewsData.rating,
            busyness: reviewsData.busyness,
            text: reviewsData.text,
            date: reviewsData.date
        }));

        const liftsData = response_3 || [];

        const copper_lifts = liftsData.map(liftsData => ({
            name: liftsData.lift_name,
            open: liftsData.open_closed,
            type: liftsData.lift_type,
        }));

        const runsData = response_4 || [];

        const copper_runs = runsData.map(runsData => ({
            run_name: runsData.run_name,
            open_closed: runsData.open_closed,
            groomed: runsData.groomed,
            difficulty: runsData.difficulty
        }));

        const weatherData = response_5 || [];

        const copper_weather = weatherData.map(weatherData => ({
            temperature_max: weatherData.temperature_max,
            temperature_min: weatherData.temperature_min,
            wind_speed_max: weatherData.wind_speed_max,
            snowfall_sum: weatherData.snowfall_sum,
            uv_index_max: weatherData.uv_index_max
        }));

        res.render('pages/copper', { trail: trails[0] , copper_reviews, copper_lifts , copper_runs, copper_weathe: copper_weather[0] });

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

    const { username = req.session.user, text, rating, busyness, title, date = formattedDate} = req.body;

    console.log("DATA:", username, rating, busyness, title, text, date);

    if (!username || rating == undefined || !busyness || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const test_q = await db.query('SELECT * FROM copper_reviews WHERE username = $1', [username]);
        console.log(test_q);
        if(test_q.length == 0){
            const query = await db.none('INSERT INTO copper_reviews (username, rating, busyness, title, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, rating, busyness, title, text, date]);
        }else{
            const query = await db.none('UPDATE copper_reviews SET rating = $1, busyness = $2, title = $3, text = $4, date = $5 WHERE username = $6', [rating, busyness, title, text, date, username]);
        }
        
        res.status(200);

        const avgrt = await db.query('SELECT AVG(rating)::numeric(5,1) AS average FROM copper_reviews');
        let avg_rating = parseFloat(avgrt[0].average);

        const avgbus = await db.query('SELECT AVG(busyness)::numeric(5,1) AS average FROM copper_reviews');
        let avg_busyness = parseFloat(avgbus[0].average);

        if(avg_rating == null || avg_busyness == null){
            console.log('No reviews found or no busyness found');
            res.redirect('/copper');
        }else{
            console.log('avg rating = ', avg_rating);
            console.log('avg busyness = ', avg_busyness)
            await db.query('UPDATE trails SET avg_rating = $1 WHERE trail_id = $2', [avg_rating, 1]);
            await db.query('UPDATE trails SET avg_busyness = $1 WHERE trail_id = $2', [avg_busyness, 1]);
        }

        res.redirect('/copper');
        // res.render('pages/review_left');
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

        const query_5 = 'SELECT * FROM eldora_weather'
        const response_5 = await db.query(query_5);

        const trailsData = response || [];

        const trails = trailsData.map(trailsData => ({
            name: trailsData.name,
            trail_id: trailsData.id,
            trail_image: trailsData.trail_image,
            avg_rating: trailsData.avg_rating,
            description: trailsData.description,
            location: trailsData.location
        }));

        const reviewsData = response_2 || [];
        
        const eldora_reviews = reviewsData.map(reviewsData => ({
            username: reviewsData.username,
            title: reviewsData.title,
            rating: reviewsData.rating,
            busyness: reviewsData.busyness,
            text: reviewsData.text,
            date: reviewsData.date
        }));

        const liftsData = response_3 || [];

        const eldora_lifts = liftsData.map(liftsData => ({
            name: liftsData.lift_name,
            open: liftsData.open_closed,
            type: liftsData.lift_type,
        }));

        const runsData = response_4 || [];

        const eldora_runs = runsData.map(runsData => ({
            run_name: runsData.run_name,
            open_closed: runsData.open_closed,
            groomed: runsData.groomed,
            difficulty: runsData.difficulty
        }));

        const eldora_weather = weatherData.map(weatherData => ({
            temperature_max: weatherData.temperature_max,
            temperature_min: weatherData.temperature_min,
            wind_speed_max: weatherData.wind_speed_max,
            snowfall_sum: weatherData.snowfall_sum,
            uv_index_max: weatherData.uv_index_max
        }));

        res.render('pages/eldora', { trail: trails[0] , eldora_reviews , eldora_lifts , eldora_runs, eldora_weathe: eldora_weather[0] });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/eldora', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/eldora_review', auth, async (req, res) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear(); // Get the full year
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Get the month (zero-based, so add 1) and ensure two digits
    const day = String(currentDate.getDate()).padStart(2, '0'); // Get the day and ensure two digits
    
    const formattedDate = `${year}-${month}-${day}`; // Format as YYYY-MM-DD    

    const { username = req.session.user, text, rating, busyness, title, date = formattedDate} = req.body;

    console.log("DATA:", username, rating, busyness, title, text, date);

    if (!username || rating == undefined || !busyness || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const test_q = await db.query('SELECT * FROM eldora_reviews WHERE username = $1', [username]);
        console.log(test_q);
        if(test_q.length == 0){
            const query = await db.none('INSERT INTO eldora_reviews (username, rating, busyness, title, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, rating, busyness, title, text, date]);
        }else{
            const query = await db.none('UPDATE eldora_reviews SET rating = $1, busyness = $2, title = $3, text = $4, date = $5 WHERE username = $6', [rating, busyness, title, text, date, username]);
        }
        res.status(200);

        const avgrt = await db.query('SELECT AVG(rating)::numeric(5,1) AS average FROM eldora_reviews');
        let avg_rating = parseFloat(avgrt[0].average);

        const avgbus = await db.query('SELECT AVG(busyness)::numeric(5,1) AS average FROM eldora_reviews');
        let avg_busyness = parseFloat(avgbus[0].average);

        if(avg_rating == null || avg_busyness == null){
            console.log('No reviews found or no busyness found');
            res.redirect('/copper');
        }else{
            console.log('avg rating = ', avgrt);
            console.log('avg busyness = ', avgbus)
            await db.query('UPDATE trails SET avg_rating = $1 WHERE trail_id = $2', [avg_rating, 3]);
            await db.query('UPDATE trails SET avg_busyness = $1 WHERE trail_id = $2', [avg_busyness, 3]);
        }
        res.redirect('/eldora');
        // res.render('pages/review_left');
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/steamboat', auth, async (req, res) => {
    try {
        const query = 'SELECT * FROM trails WHERE name = $1 LIMIT 1'
        const response = await db.query(query, ['steamboat']);

        const query_2 = 'SELECT * FROM steamboat_reviews'
        const response_2 = await db.query(query_2);
        
        const query_3 = 'SELECT * FROM steamboat_lifts'
        const response_3 = await db.query(query_3);

        const query_4 = 'SELECT * FROM steamboat_runs'
        const response_4 = await db.query(query_4);

        const query_5 = 'SELECT * FROM steamboat_weather'
        const response_5 = await db.query(query_5);

        const trailsData = response || [];

        const trails = trailsData.map(trailsData => ({
            name: trailsData.name,
            trail_id: trailsData.id,
            trail_image: trailsData.trail_image,
            avg_rating: trailsData.avg_rating,
            description: trailsData.description,
            location: trailsData.location
        }));

        const reviewsData = response_2 || [];

        const steamboat_reviews = reviewsData.map(reviewsData => ({
            username: reviewsData.username,
            title: reviewsData.title,
            rating: reviewsData.rating,
            busyness: reviewsData.busyness,
            text: reviewsData.text,
            date: reviewsData.date
        }));

        const liftsData = response_3 || [];

        const steamboat_lifts = liftsData.map(liftsData => ({
            name: liftsData.lift_name,
            open: liftsData.open_closed,
            type: liftsData.lift_type,
        }));

        const runsData = response_4 || [];

        const steamboat_runs = runsData.map(runsData => ({
            run_name: runsData.run_name,
            open_closed: runsData.open_closed,
            groomed: runsData.groomed,
            difficulty: runsData.difficulty
        }));

        const steamboat_weather = weatherData.map(weatherData => ({
            temperature_max: weatherData.temperature_max,
            temperature_min: weatherData.temperature_min,
            wind_speed_max: weatherData.wind_speed_max,
            snowfall_sum: weatherData.snowfall_sum,
            uv_index_max: weatherData.uv_index_max
        }));

        res.render('pages/steamboat', { trail: trails[0] , steamboat_reviews , steamboat_lifts , steamboat_runs, steamboat_weathe: steamboat_weather[0] });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/steamboat', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/steamboat_review', auth, async (req, res) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear(); // Get the full year
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Get the month (zero-based, so add 1) and ensure two digits
    const day = String(currentDate.getDate()).padStart(2, '0'); // Get the day and ensure two digits
    
    const formattedDate = `${year}-${month}-${day}`; // Format as YYYY-MM-DD    

    const { username = req.session.user, text, rating, busyness, title, date = formattedDate} = req.body;

    console.log("DATA:", username, rating, busyness, title, text, date);

    if (!username || rating == undefined || !busyness || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const test_q = await db.query('SELECT * FROM steamboat_reviews WHERE username = $1', [username]);
        console.log(test_q);
        if(test_q.length == 0){
            const query = await db.none('INSERT INTO steamboat_reviews (username, rating, busyness, title, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, rating, busyness, title, text, date]);
        }else{
            const query = await db.none('UPDATE steamboat_reviews SET rating = $1, busyness = $2, title = $3, text = $4, date = $5 WHERE username = $6', [rating, busyness, title, text, date, username]);
        }
        res.status(200);

        const avgrt = await db.query('SELECT AVG(rating)::numeric(5,1) AS average FROM steamboat_reviews');
        let avg_rating = parseFloat(avgrt[0].average);

        const avgbus = await db.query('SELECT AVG(busyness)::numeric(5,1) AS average FROM steamboat_reviews');
        let avg_busyness = parseFloat(avgbus[0].average);

        if(avg_rating == null || avg_busyness == null){
            console.log('No reviews found or no busyness found');
            res.redirect('/copper');
        }else{
            console.log('avg rating = ', avgrt);
            console.log('avg busyness = ', avgbus)
            await db.query('UPDATE trails SET avg_rating = $1 WHERE trail_id = $2', [avg_rating, 4]);
            await db.query('UPDATE trails SET avg_busyness = $1 WHERE trail_id = $2', [avg_busyness, 4]);
        }

        res.redirect('/steamboat');
        // res.render('pages/review_left');
    } catch (error) {
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

        const query_5 = 'SELECT * FROM winter_park_weather'
        const response_5 = await db.query(query_5);

        const trailsData = response || [];

        const trails = trailsData.map(trailsData => ({
            name: trailsData.name,
            trail_id: trailsData.id,
            trail_image: trailsData.trail_image,
            avg_rating: trailsData.avg_rating,
            description: trailsData.description,
            location: trailsData.location
        }));

        const reviewsData = response_2 || [];

        const winter_park_reviews = reviewsData.map(reviewsData => ({
            username: reviewsData.username,
            title: reviewsData.title,
            rating: reviewsData.rating,
            busyness: reviewsData.busyness,
            text: reviewsData.text,
            date: reviewsData.date
        }));

        const liftsData = response_3 || [];

        const winter_park_lifts = liftsData.map(liftsData => ({
            name: liftsData.lift_name,
            open: liftsData.open_closed,
            type: liftsData.lift_type,
        }));

        const runsData = response_4 || [];

        const winter_park_runs = runsData.map(runsData => ({
            run_name: runsData.run_name,
            open_closed: runsData.open_closed,
            groomed: runsData.groomed,
            difficulty: runsData.difficulty
        }));

        const winter_park_weather = weatherData.map(weatherData => ({
            temperature_max: weatherData.temperature_max,
            temperature_min: weatherData.temperature_min,
            wind_speed_max: weatherData.wind_speed_max,
            snowfall_sum: weatherData.snowfall_sum,
            uv_index_max: weatherData.uv_index_max
        }));

        res.render('pages/winter_park', { trail: trails[0], winter_park_reviews , winter_park_lifts , winter_park_runs, winter_park_weathe: winter_park_weather[0] });

    } catch (error) {
        console.error("Error fetching trail data:", error);
        res.render('pages/winter_park', { trails: [], message: 'Failed to load trail data. Please try again later.' });
    }
});

app.post('/winter_park_review', auth, async (req, res) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear(); // Get the full year
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Get the month (zero-based, so add 1) and ensure two digits
    const day = String(currentDate.getDate()).padStart(2, '0'); // Get the day and ensure two digits
    
    const formattedDate = `${year}-${month}-${day}`; // Format as YYYY-MM-DD    

    const { username = req.session.user, text, rating, busyness, title, date = formattedDate} = req.body;

    console.log("DATA:", username, rating, busyness, title, text, date);

    if (!username || rating == undefined || !busyness || !title || !date) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    try {
        const test_q = await db.query('SELECT * FROM winter_park_reviews WHERE username = $1', [username]);
        console.log(test_q);
        if(test_q.length == 0){
            const query = await db.none('INSERT INTO winter_park_reviews (username, rating, busyness, title, text, date) VALUES ($1, $2, $3, $4, $5, $6)', [username, rating, busyness, title, text, date]);
        }else{
            const query = await db.none('UPDATE winter_park_reviews SET rating = $1, busyness = $2, title = $3, text = $4, date = $5 WHERE username = $6', [rating, busyness, title, text, date, username]);
        }

        res.status(200);

        const avgrt = await db.query('SELECT AVG(rating)::numeric(5,1) AS average FROM winter_park_reviews');
        let avg_rating = parseFloat(avgrt[0].average);

        const avgbus = await db.query('SELECT AVG(busyness)::numeric(5,1) AS average FROM winter_park_reviews');
        let avg_busyness = parseFloat(avgbus[0].average);

        if(avg_rating == null || avg_busyness == null){
            console.log('No reviews found or no busyness found');
            res.redirect('/copper');
        }else{
            console.log('avg rating = ', avgrt);
            console.log('avg busyness = ', avgbus)
            await db.query('UPDATE trails SET avg_rating = $1 WHERE trail_id = $2', [avg_rating, 2]);
            await db.query('UPDATE trails SET avg_busyness = $1 WHERE trail_id = $2', [avg_busyness, 2]);
        }
        res.redirect('/winter_park');
        // res.render('pages/review_left');
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');