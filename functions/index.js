const functions = require('firebase-functions');
const express = require('express');

const {getAllPosts, createOnePost} = require('./handlers/posts');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUserData} = require('./handlers/users');
const firebaseIsAuth = require('./utils/firebaseIsAuth');

const app = express();

//-----Posts route-----
//Get all posts
app.get('/posts', getAllPosts);
// Create one post
app.post('/createPost', firebaseIsAuth, createOnePost);

//-----Users Routs-----
//Sign up method
app.post('/signup', signup);
//Login method
app.post('/login', login);
//Uploading user image
app.post('/user/image', firebaseIsAuth, uploadImage);
//Add user details
app.post('/user', firebaseIsAuth, addUserDetails);
//Get full data of authenticated user
app.get('/user', firebaseIsAuth, getAuthenticatedUserData);

exports.api = functions.region('europe-west3').https.onRequest(app);