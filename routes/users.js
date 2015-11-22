var express = require('express');
var router = express.Router();
var utils = require('../utils/utils');
var User = require('../models/user');
var sheet = require('../models/sheet');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/*
  If the user is logged in, send a response stating, "There is already a user logged in".
  If a username and password were not both submitted, send a response stating "Username or password not provided".
  If one of the above two errors occurred, return true immediately to show that an error was sent. Otherwise, returns
  false at the end of the method.
*/
var isLoggedInOrInvalidBody = function(req, res) {
  if (req.currentUser) {
    utils.sendErrResponse(res, 403, 'There is already a user logged in.');
    return true;
  } else if (!(req.body.username && req.body.password)) {
    utils.sendErrResponse(res, 400, 'Username or password not provided.');
    return true;
  }
  return false;
};

/*
  Checks to see if the username and password provided is valid. If either is empty or 
  incorrect, an error will be returned. If a user is already logged in, it will also return 
  an error.

  POST /users/login
  Request body:
    - username
    - password
  Response:
    - success: true if login succeeded; false otherwise
    - content: on success, an object with a single field 'user', the object of the logged in user
    - err: on error, an error message
*/
router.post('/login', function(req, res) {
  if (isLoggedInOrInvalidBody(req, res)) {
    return;
  }

  User.verifyPassword(req.body.username, req.body.password, function(err, match) {
    if (match) {
      req.session.username = req.body.username;
      utils.sendSuccessResponse(res, { user : req.body.username });
    } else {
      utils.sendErrResponse(res, 403, 'Username or password invalid.');
    }
  });
});

/*
  Logs a user out and destroys the session. If there is no user logged in, returns an error.

  POST /users/logout
  Request body: empty
  Response:
    - success: true if logout succeeded; false otherwise
    - err: on error, an error message
*/
router.post('/logout', function(req, res) {
  if (req.currentUser) {
    req.session.destroy();
    utils.sendSuccessResponse(res);
  } else {
    utils.sendErrResponse(res, 403, 'There is no user currently logged in.');
  }
});

/*
  Creates a new user in the system. All usernames in the system must be unique. 
  If a duplicate username is given, returns an error. If a user is already logged in, 
  it will also return an error. This method does NOT automatically log in the user.

  POST /users
  Request body:
    - username
    - password
  Response:
    - success: true if user creation succeeded; false otherwise
    - err: on error, an error message
*/
router.post('/', function(req, res) {
  if (isLoggedInOrInvalidBody(req, res)) {
    return;
  }

  User.createNewUser(req.body.username, req.body.password, 
    function(err) {
      console.log(err);
      if (err) {
        if (err.taken) {
          utils.sendErrResponse(res, 400, 'That username is already taken!');
        } else {
          utils.sendErrResponse(res, 500, 'An unknown error has occurred.');
        }
      } else {
        utils.sendSuccessResponse(res, req.body.username);
      }
  });
});

/*
  Determines whether there is a current user logged in.

  GET /users/current
  No request parameters
  Response:
    - success.loggedIn: true if there is a user logged in; false otherwise
    - success.user: if success.loggedIn, the currently logged in user
*/
router.get('/current', function(req, res) {
  if (req.currentUser) {
    utils.sendSuccessResponse(res, { loggedIn : true, user : req.currentUser.username });
  } else {
    utils.sendSuccessResponse(res, { loggedIn : false });
  }
});

module.exports = router;
