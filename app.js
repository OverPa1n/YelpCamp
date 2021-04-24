const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Campground = require('./models/campground');
const campgroundSchema = require('./schemas')
const methodOverride = require('method-override');
const catchAsync = require('./helpers/catchAsync');
const ExpressError = require('./helpers/expressError');
// const {campgroundSchema} = require('./schemas.js');
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('database connected')
});


//middleLayers
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

const validateCampground = (req,res,next) => {

    const {error} = campgroundSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(err => err.message).join(',');
        throw new ExpressError(400, msg);
    }else {
        next()
    }
}
//queries

app.get('/', (req, res) => {
    res.render('home')
});
app.get('/campgrounds', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds})
}));

app.get('/campgrounds/new', catchAsync(async (req, res) => {
    await res.render('campgrounds/new')
}));


app.post('/campgrounds', validateCampground,catchAsync(async (req, res, next) => {
    // if(!req.body.campground) throw new ExpressError(400, 'Invalid Campground Data')

    const campground = req.body.campground;
    const newCampground = new Campground(campground);
    await newCampground.save();
    res.redirect(`/campgrounds/${newCampground._id}`);


}));

app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    res.render('campgrounds/show', {campground});

}));

app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    res.render('campgrounds/edit', {campground});
}));

app.put('/campgrounds/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

app.all('*', (req,res,next) => {
    next(new ExpressError(404, 'Page Not Found'));
})

app.use((err, req, res, next) => {
    const {status = 500} = err;
    if(!err.message) err.message = 'Ohh something went wrong!'
    res.status(status).render('error', {err})


});


//Connect to server
app.listen(3000, () => {
    console.log('serving on port 3000');
});