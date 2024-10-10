const { prisma } = require("../prisma/prisma-client");

const PostController = {
  createPost: async (req, res) => {
    const { text, imageUrl, reply } = req.body;
    const authorId = req.user.userId;
    const { replyToId, excludeReplyUserIds } = reply;
    console.log(replyToId, excludeReplyUserIds);

    // TODO: implement notifications...😭 (that's what excludeReplyUserIds are for)

    if (!text && !imageUrl) {
      return res
        .status(400)
        .json({ error: "Either text or image must be provided." });
    }

    try {
      const newPost = await prisma.post.create({
        data: {
          text,
          imageUrl,
          authorId,
          parentId: replyToId,
        },
      });
      res.status(201).json(newPost);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  getAllPosts: async (req, res) => {
    try {
      const posts = await prisma.post.findMany({ where: { parent: null } });
      console.log(posts);
      res.status(200).json(posts);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  getPostById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: { likes: true, comments: true },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      const isLiked = userId
        ? await prisma.like.findFirst({
            where: { AND: [{ userId: userId }, { postId: id }] },
          })
        : false;

      res.status(200).json({ ...post, isLiked: Boolean(isLiked) });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  deletePost: async (req, res) => {
    const { id } = req.params;
    const authorId = req.user ? req.user.userId : null;

    try {
      const existingPost = await prisma.post.findUnique({
        where: { id, authorId },
      });

      if (!existingPost) {
        return res.status(404).json({
          error: "Post not found or you don't have access to delete it.",
        });
      }

      const post = await prisma.post.delete({
        where: { id, authorId },
      });

      res.status(200).json(post);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
};

module.exports = PostController;
