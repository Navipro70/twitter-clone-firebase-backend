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
                    timestamp: doc.data().timestamp
                })
            });
            return res.json(posts)
        })
        .catch(err => console.error(err))
};

exports.createOnePost = (req, res) => {
    const newPost = {
        userHandle: req.user.handle,
        postText: req.body.postText,
        timestamp: new Date().toISOString()
    };
    db
        .collection('posts')
        .add(newPost)
        .then(doc => {
            res.json({message: `Document ${doc.id} created successfully`})
        })
        .catch(err => {
            res.status(500).json({error: 'Something went wrong'});
            console.error(err)
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
            res.status(500).json({error: err.code})
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
            if(!doc.exists) return res.status(404).json({error: 'Not found'});
            return db.collection('comments').add(commentData)
        })
        .then(() => {
            return res.json(commentData)
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })
};