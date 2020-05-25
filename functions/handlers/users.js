const {db, admin} = require('../utils/admin');
const config = require('../utils/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {validateSignUpData, validateLoginData, reduceUserDetails} = require('../utils/validators');

exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    const {valid, errors} = validateSignUpData(newUser);
    if (!valid) return res.status(400).json(errors);

    const noImage = 'no-img.png';

    let mainToken, userId;
    db
        .doc(`/users/${newUser.handle}`)
        .get() // Checking that new user is unique
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({handle: 'This handle is already use'})
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken()
        })
        .then(token => {
            mainToken = token;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                timestamp: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({mainToken})
        })
        .catch(err => {
            console.error(err);
            if (err.code === "auth/email-already-in-use") return res.status(400).json({email: 'Email is already use'});
            return res.status(500).json({general: "Something went wrong, please try again"})
        });
};

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };
    const {valid, errors} = validateLoginData(user);
    if (!valid) return res.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            return res.json({token})
        })
        .catch(error => {
            console.log(error);
            if (error.code === "auth/wrong-password") return res.status(500).json({general: "Wrong credential, please, try again"});
            return res.status(500).json({general: "Something went wrong, please try again"})
        });
};

exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: req.headers});

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error: "Wrong type submitted"});
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // 15723434565456.png - Random number + .png
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath))
    });
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({imageUrl})
            })
            .then(() => {
                return res.json({message: 'Image uploaded successfully'})
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({general: "Something went wrong, please try again"})
            })
    });
    busboy.end(req.rawBody)
};

exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db
        .doc(`users/${req.user.handle}`)
        .update(userDetails)
        .then(() => {
            return res.json({message: "Details added successfully"})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.getUserDetails = (req, res) => {
    let userData = {};

    db
        .doc(`/users/${req.params.handle}`)
        .get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({error: 'Not found'});
            userData.user = doc.data();
            return db
                .collection(`posts`)
                .where('userHandle', '==', req.params.handle)
                .orderBy('timestamp', 'desc')
                .get()
        })
        .then(docsOfPosts => {
            userData.posts = [];
            docsOfPosts.forEach(onePostDoc => {
                const docData = onePostDoc.data();
                userData.posts.push({
                    postText: docData.postText,
                    timestamp: docData.timestamp,
                    userHandle: docData.userHandle,
                    userImage: docData.userImage,
                    likeCount: docData.likeCount,
                    commentCount: docData.commentCount,
                    postId: onePostDoc.id
                })
            });
            return res.status(200).json(userData)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.getAuthenticatedUserData = (req, res) => {
    let userData = {};
    db
        .doc(`/users/${req.user.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db
                    .collection('likes')
                    .where('userHandle', '==', req.user.handle)
                    .get()
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data())
            });
            return db
                .collection('/notifications')
                .where('recipient', '==', req.user.handle)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get()
        })
        .then(data => {
            userData.notifications = [];
            data.forEach(doc => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    timestamp: doc.data().timestamp,
                    postId: doc.data().postId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id
                });
            });
            return res.json(userData)
        })
        .catch(err => {
            console.error();
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch(); //It's require to update a Array of objects
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, {read: 'true'})
    })
    batch.commit()
        .then(() => {
            return res.status(200).json({message: 'Notifications marked to read'})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};