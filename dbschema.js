let db = {
    users: [
        {
            userId: 'u8Q9kzk8qAF1vz14Oq13CNp09x',
            email: 'user@email.com',
            handle: 'userName',
            timestamp: "2020-05-23T23:03:25.619Z",
            imageUrl: 'image/qzkkqwdqd1231ddq/12eqwkDqkwqdQi',
            bio: "Hello, I'm reporter, nice to meet you",
            website: "https://user.com",
            location: "London, UK"
        }
    ],
    posts: [
        {
            userHandle: 'user',
            postText: 'This is post text',
            timestamp: "2020-05-21T22:39:07.797Z",
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'userName',
            postId: '1Jqm8JQ9dO0zqQKaz914hnvGZ0',
            commentText: 'This is comment text',
            timestamp: '2020-05-21T22:39:07.797Z'
        }
    ]
};

const userDetails = {
    //Redux data
    credentials: {
        userId: 'u8Q9kzk8qAF1vz14Oq13CNp09x',
        email: 'user@email.com',
        handle: 'userName',
        timestamp: "2020-05-23T23:03:25.619Z",
        imageUrl: 'image/qzkkqwdqd1231ddq/12eqwkDqkwqdQi',
        bio: "Hello, I'm reporter, nice to meet you",
        website: "https://user.com",
        location: "London, UK"
    },
    likes: [
        {
            userHandle: 'user',
            postId: "GQA8Q18Aqke19QKQ0Anbkc"
        },
        {
            userHandle: 'user',
            postId: "1iQ8mqN8qkc8u1kc"
        }
    ]
};