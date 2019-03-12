const API_KEY = process.env.WEATHER_API_KEY;

//Weather bit API = https://www.weatherbit.io/api/weather-forecast-16-day
//https://www.weatherbit.io/api/weather-current
//https://www.weatherbit.io/api/weather-forecast-48-hour

//common parameters
// only use one of the parameters below for receiving weather data
// postal_code={zipcode}&country={US} -> get weather based on zipcode
// lat={lat}&lon={lon} -> return weather information based on latitude and longitude

//express is the framework we are going to be using to handle requests
const express = require("express");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

const bodyParse = require("body-parser");

//request is the module to make a request to a webservice
const request = require("request");

var router = express.Router();
router.use(bodyParse.json());

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

/**
 * endpoint that will store the weather information in the database
 */
/*PrimaryKey SERIAL PRIMARY KEY,
                        MemberID INT,
                        Nickname VARCHAR(255),
                        Lat DECIMAL,
                        Long DECIMAL,
                        ZIP INT,
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)*/
router.post("/save", (req, res) => {
    let username = req.body['username'];
    let city = req.body['city'];
    let lat = req.body['lat'];
    let lon = req.body['lon'];
    let zip = req.body['zip'];
    if (username && city && (lat && lon) || zip) {
        var params = [username, city, lat, lon, zip];
        //get the user
        db.one("SELECT memberid FROM members WHERE username=$1", [username])
            .then((row) => {
                //get the nickname from location table
                db.manyOrNone("SELECT nickname FROM locations WHERE memberid=$1", [row.memberid])
                    .then((rows) => {
                        var cityExists = false;
                        for (var i = 0; i < rows.length; i++) {
                            if (city == rows[i].nickname) {
                                cityExists = true;
                            }
                        }
                        if (cityExists) {
                            res.send({
                                success: false,
                                err: "Location already exists"
                            });
                        } else {
                            db.none("INSERT INTO Locations(memberid, nickname, lat, long, zip) VALUES ($1, $2, $3, $4, $5)", 
                                [row.memberid, city, lat, lon, zip])
                                .then(() => {
                                    res.send({
                                        success: true
                                    });
                                }).catch((err) => {
                                    res.send({
                                        success: false,
                                        err: err
                                    });
                                });
                        }
                    }).catch((err) => {
                        res.send({
                            success: false,
                            err: err
                        });
                    })

            }).catch((err) => {
                res.send({
                    success: false,
                    err: "user doesnt exist"
                })
            })
        
    } else {
        res.send({success: false, error: "Wrong Inputs"});
        console.log("In WeatherSave, Wrong inputs");
    }

});

/*PrimaryKey SERIAL PRIMARY KEY,
                        MemberID INT,
                        Nickname VARCHAR(255),
                        Lat DECIMAL,
                        Long DECIMAL,
                        ZIP INT,
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)*/
/**
 * method that will get all the locations that correlate to the memberID
 */
router.post("/getWeather", (req, res) => {
    let username = req.body['username'];
    if (!username) {
        res.send({
            success: false,
            err: "username not supplied"
        });
        return;
    }
    //get the memberid based on the username
    db.one("SELECT MemberID FROM Members WHERE Username=$1", [username])
        .then((row) => {
            //get weather all the rows with weather based on memberid
            db.manyOrNone("SELECT nickname, lat, long, zip FROM Locations WHERE memberid=$1", [row.memberid])
                .then((rows) => {
                    res.send({
                        success: true,
                        locations: rows
                    });
                }).catch((err) => {
                    res.send({
                        success: false,
                        err: "Failed to get locations " + err
                    });
                })
        }).catch((err) => {
            res.send({
                success: false,
                err: "User Does not exist"
            });
        });
});

/*
* Method that will take a username and nickname for a location
* and will delete it from the table
*/
router.post("/delete", (req, res) => {
    let username = req.body['username'];
    let city = req.body['city'];
    if (!username) {
        res.send({
            success: false,
            err: "username not supplied"
        });
    }
    db.one("SELECT MemberId FROM Members WHERE username=$1", [username])
        .then((row) => {
            db.none("DELETE FROM Locations WHERE Locations.nickname=$1 AND Locations.memberid=$2", [city, row.memberid])
                .then(() => {
                    res.send({
                        success: true
                    });
                }).catch((err) => {
                    res.send({
                        success: false,
                        err: err
                    });
                });
        }).catch((err) => {
            res.send({
                success: false,
                err: err
            });
        });
});



module.exports = router;