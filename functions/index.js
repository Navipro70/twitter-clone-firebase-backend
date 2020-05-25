const functions = require('firebase-functions');
const express = require('express');

const {getAllPosts, createOnePost, getPost, createNewComment, likePost, unlikePost, deletePost} = require('./handlers/posts');
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUserData} = require('./handlers/users');
const firebaseIsAuth = require('./utils/firebaseIsAuth');

const app = express();

//-----Posts route-----
app.get('/posts', getAllPosts); //Get all posts
app.post('/createPost', firebaseIsAuth, createOnePost); //Create one post
app.get('/post/:postId', getPost); //Get post by id
app.delete('/post/:postId', firebaseIsAuth, deletePost); //Delete post
app.get('/post/:postId/like', firebaseIsAuth, likePost); //Like post
app.get('/post/:postId/unlike', firebaseIsAuth, unlikePost); //Like post
app.post('/post/:postId/comment', firebaseIsAuth, createNewComment); //Make comment on a post

//-----Users Routs-----
app.post('/signup', signup); //Sign up method
app.post('/login', login); //Login method
app.post('/user/image', firebaseIsAuth, uploadImage); //Uploading user image
app.post('/user', firebaseIsAuth, addUserDetails); //Add user details
app.get('/user', firebaseIsAuth, getAuthenticatedUserData); //Get full data of authenticated user

exports.api = functions.region('europe-west3').https.onRequest(app);