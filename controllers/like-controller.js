const { prisma } = require("../prisma/prisma-client");

const LikeController = {
  likePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          likes: true,
        },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      const existingLike = await prisma.like.findFirst({
        where: { userId, postId: id },
      });

      if (existingLike) {
        return res.status(403).json({ error: "Post is already liked" });
      }

      const like = await prisma.like.create({
        data: {
          userId,
          postId: id,
        },
      });

      res.status(201).json({ post, like });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  unlikePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          likes: true,
        },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      const existingLike = await prisma.like.findFirst({
        where: { userId, postId: id },
      });

      if (!existingLike) {
        return res.status(403).json({ error: "Post isn't liked" });
      }

      const like = await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      res.status(201).json({ post, like });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
};

module.exports = LikeController;
