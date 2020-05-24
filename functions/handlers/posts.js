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