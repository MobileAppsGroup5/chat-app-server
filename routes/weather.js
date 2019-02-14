const API_KEY = process.env.WEATHER_API_KEY;

//Weather bit API = https://www.weatherbit.io/api/weather-forecast-16-day
//https://www.weatherbit.io/api/weather-current

//common parameters
// only use one of the parameters below for receiving weather data
// postal_code={zipcode}&country={US} -> get weather based on zipcode
// lat={lat}&lon={lon} -> return weather information based on latitude and longitude

//express is the framework we are going to be using to handle requests
const express = require("express");

//request is the module to make a request to a webservice
const request = require("request");

var router = express.Router();

/*
* End point that will try to get the current weather data.
*/
router.get("/current", (req, res) => {
    
    let url = `https://api.weatherbit.io/v2.0/current?key=${API_KEY}&units=I`

    //find the query string (parameters) and pass them on to 
    //weatherbit.io webservice
    let n = req.originalUrl.indexOf('?') + 1;
    if (n > 0) {
        url += '&' + req.originalUrl.substring(n);
    }

    //when this endpoint gets a request, make a request to weatherbit.io webservice.
    request(url, function(error, response, body) {
        //if there is an error, then send the error back to the user.
        //I think that the most common error is invalid parameters meaning that 
        //parameters were wrong
        if (error) {
            res.send(error);
        } else {
            //pass along the result
            //res.send(response);
            res.send(body);
        }
    });
});

/*
* endpoint that will try to get a JSON object of 24 hour weather data
*/
router.get("/24h", (req, res) => {
    
    let url = `https://api.weatherbit.io/v2.0/forecast/hourly?key=${API_KEY}&hours=24&units=I`;

    let n = req.originalUrl.indexOf("?") + 1;
    if (n > 0) {
        url += '&' + req.originalUrl.substring(n);
    }

    //when this endpoint gets a request, make a request to weatherbit.io api.
    request(url, function(error, response, body) {
        //if there is an error, then send the error back to the user.
        if (error) {
            res.send(error);
        } else {
            //pass along the result
            res.send(body);
        }
    });
});

/*
* endpoint that will get a 10 day forecast of specified area
*/
router.get("/10d", (req, res) => {
    
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${API_KEY}&days=10&units=I`;

    let n = req.originalUrl.indexOf("?") + 1;
    if (n > 0) {
        url += '&' + req.originalUrl.substring(n);
    }

    //when this endpoint gets a request, make a request to weatherbit.io api.
    request(url, function(error, response, body) {
        //if there is an error, then send the error back to the user.
        if (error) {
            res.send(error);
        } else {
            //pass along the result
            res.send(body);
        }
    });
});



module.exports = router;