const { prisma } = require('../prisma/prisma-client');

const PostController = {
  createPost: async (req, res) => {
    const { text, imageUrl, author } = req.body;

    if (!author || (!text && !imageUrl)) {
      return res
        .status(400)
        .json({ error: "Either text or image must be provided." });
    }

    try {
      const newPost = await prisma.post.create({
        data: {
          text,
          imageUrl,
          author,
        },
      });
      res.status(201).json(newPost);
    } catch (e) {
      console.log(e)
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  getAllPosts: async (req, res) => {
    try {
      const posts = await prisma.post.findMany();
      res.status(200).json(posts);
    } catch (e) {
      console.log(e)
      res.status(500).json({ error: "Something went wrong." });
    }
  }
};

module.exports = PostController
