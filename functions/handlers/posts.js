const {db} = require('../utils/admin');

exports.getAllPosts = (req, res) => {
    db
        .collection('posts')
        .orderBy('timestamp', 'desc')
        .get()
        .then(data => {
            let posts = [];
            data.forEach(doc => {
                posts.push({
                    postId: doc.id,
                    postText: doc.data().postText,
                    userHandle: doc.data().userHandle,
                    timestamp: doc.data().timestamp,
                    userImage: doc.data().userImage
                })
            });
            return res.json(posts)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.createOnePost = (req, res) => {
    const postText = req.body.postText.trim();
    if (postText === '') return res.status(500).json({error: "Field can't be empty"});
    if (postText.length > 1000) return res.status(500).json({error: "Field is too long"});
    const newPost = {
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        postText: postText,
        timestamp: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };
    db
        .collection('posts')
        .add(newPost)
        .then(doc => {
            const resPost = newPost;
            resPost.postId = doc.id;
            res.json(resPost)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.getPost = (req, res) => {
    let postData = {};
    db
        .doc(`/posts/${req.params.postId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({error: 'Post not found'})
            }
            postData = doc.data();
            postData.postId = doc.id;
            return db
                .collection('comments')
                .orderBy('timestamp', 'desc')
                .where('postId', '==', req.params.postId)
                .get()
        })
        .then(data => {
            postData.comments = [];
            data.forEach(doc => {
                postData.comments.push(doc.data())
            });
            return res.json(postData)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.createNewComment = (req, res) => {
    if (req.body.commentText.trim() === '') return res.status(400).json({error: 'Must not be empty'});

    let commentData = {
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        postId: req.params.postId,
        timestamp: new Date().toISOString(),
        commentText: req.body.commentText,
    };
    return db
        .doc(`/posts/${req.params.postId}`)
        .get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({error: 'Not found'});
            return doc.ref.update({ commentCount: doc.data().commentCount + 1})
        })
        .then(() => {
            return db.collection('comments').add(commentData)
        })
        .then(() => {
            return res.json(commentData)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.likePost = (req, res) => {
    const likeData = {
        userHandle: req.user.handle,
        postId: req.params.postId
    };
    let postData;
    const likeDocument = db
        .collection(`likes`)
        .where('userHandle', '==', req.user.handle)
        .where('postId', '==', req.params.postId)
        .limit(1);

    let postDocument = db.doc(`/posts/${req.params.postId}`);

    postDocument
        .get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({error: 'Not found'});
            postData = doc.data();
            postData.postId = doc.id;
            return likeDocument.get()
        })
        .then(data => {
            if (data.empty) {
                return db.collection(`likes`).add(likeData)
                    .then(() => {
                        postData.likeCount++;
                        return postDocument.update({likeCount: postData.likeCount})
                    })
                    .then(() => {
                        return res.json(postData)
                    })
            } else return res.status(400).json({error: 'Post already liked'})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.unlikePost = (req, res) => {
    let postData;
    const likeDocument = db
        .collection(`likes`)
        .where('userHandle', '==', req.user.handle)
        .where('postId', '==', req.params.postId)
        .limit(1);

    let postDocument = db.doc(`/posts/${req.params.postId}`);

    postDocument
        .get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({error: 'Not found'});
            postData = doc.data();
            postData.postId = doc.id;
            return likeDocument.get()
        })
        .then(data => {
            if (data.empty) {
                return res.status(400).json({error: 'Post is not liked'})
            } else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        postData.likeCount--;
                        return postDocument.update({likeCount: postData.likeCount})
                    })
                    .then(() => {
                        return res.json({postData})
                    })
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};

exports.deletePost = (req, res) => {
    const postDocument = db.doc(`/posts/${req.params.postId}`);
    postDocument
        .get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({error: 'Post already deleted or does not exist'});
            if (req.user.handle !== doc.data().userHandle) return res.status(403).json({error: 'Unauthorized'});
            return postDocument.delete()
        })
        .then(() => {
            res.status(200).json({message: `Post ${req.params.postId} deleted successfully`})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({general: "Something went wrong, please try again"})
        })
};