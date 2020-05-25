const functions = require('firebase-functions');
const express = require('express');
const {db} = require('./utils/admin');
const firebaseIsAuth = require('./utils/firebaseIsAuth');
const {
    getAllPosts,
    createOnePost,
    getPost,
    createNewComment,
    likePost,
    unlikePost,
    deletePost
} = require('./handlers/posts');

const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUserData,
    getUserDetails,
    markNotificationsRead
} = require('./handlers/users');


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
app.get('/user/:handle', getUserDetails); //Public Route to get user details
app.post('/notifications', firebaseIsAuth, markNotificationsRead); //Req for backend

exports.createNotificationOnLike = functions
    .region('europe-west3')
    .firestore
    .document('likes/{id}')
    .onCreate((snapshot) => {
        return db
            .doc(`/posts/${snapshot.data().postId}`)
            .get()
            .then(doc => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db
                        .doc(`/notifications/${snapshot.id}`)
                        .set({
                            timestamp: new Date().toISOString(),
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'like',
                            read: false,
                            postId: doc.id
                        })
                }
            })
            .catch(err => console.error(err))
    });

exports.createNotificationOnUnlike = functions
    .region('europe-west3')
    .firestore
    .document('likes/{id}')
    .onDelete(snapshot => {
        return db
            .doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => console.error(err))
    });

exports.createNotificationOnComment = functions
    .region('europe-west3')
    .firestore
    .document('comments/{id}')
    .onCreate((snapshot) => {
        return db
            .doc(`/posts/${snapshot.data().postId}`)
            .get()
            .then(doc => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db
                        .doc(`/notifications/${snapshot.id}`)
                        .set({
                            timestamp: new Date().toISOString(),
                            recipient: doc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'comment',
                            read: false,
                            postId: doc.id
                        })
                }
            })
            .catch(err => console.error(err))
    });

exports.onUserImageChange = functions.region('europe-west3').firestore.document('/users/{userId}')
    .onUpdate(change => {
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            let batch = db.batch();
            return db.collection('posts')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then(data => {
                    data.forEach(doc => {
                        const post = db.doc(`/posts/${doc.id}`);
                        batch.update(post, {userImage: change.after.data().imageUrl})
                    });
                    return batch.commit()
                })
        } else return true
    });

exports.onPostDelete = functions
    .region('europe-west3')
    .firestore
    .document('/posts/{postId}')
    .onDelete((snapshot, context) => {
        const postId = context.params.postId;
        const batch = db.batch();
        return db
            .collection(`comments`)
            .where('postId', '==', postId)
            .get()
            .then(commentsData => {
                commentsData.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`))
                });
                return db
                    .collection('likes')
                    .where(`postId`, '==', postId)
                    .get()
            })
            .then(likesData => {
                likesData.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`))
                });
                return db
                    .collection('notifications')
                    .where(`postId`, '==', postId)
                    .get()
            })
            .then(notificationsData => {
                notificationsData.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`))
                });
                return batch.commit()
            })
            .catch(err => {
                console.error(err)
            })
    });

exports.api = functions.region('europe-west3').https.onRequest(app);