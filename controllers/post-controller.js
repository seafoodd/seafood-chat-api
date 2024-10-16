const { prisma } = require("../prisma/prisma-client");

const PostController = {
  createPost: async (req, res) => {
    const { text, imageUrl } = req.body;
    const authorId = req.user.userId;
    let reply;

    if (req.body.reply) {
      try {
        reply = JSON.parse(req.body.reply);
      } catch (e) {
        return res.status(400).json({ error: "Invalid reply format." });
      }
    }

    const { replyToId, excludeReplyUserIds } = reply || {};
    console.log(replyToId, excludeReplyUserIds);

    // TODO: implement notifications...😭 (that's what excludeReplyUserIds are for)

    if (!text && !imageUrl) {
      return res
        .status(400)
        .json({ error: "Either text or image must be provided." });
    }

    let filePath;

    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    try {
      const newPost = await prisma.post.create({
        data: {
          text,
          imageUrl: filePath ? `/${filePath}` : undefined,
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
      const posts = await prisma.post.findMany({
        where: { parent: null },
        include: {
          author: {
            select: {
              displayName: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { replies: true, likes: true },
          },
        },
      });
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
        include: {
          author: {
            select: {
              displayName: true,
              username: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: { _count: { select: { likes: true, replies: true } } },
          },
          _count: { select: { likes: true, replies: true } },
        },
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
