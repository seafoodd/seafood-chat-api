const { prisma } = require("../prisma/prisma-client");
const fs = require("fs");
const path = require("fs");
const PostController = {
  createPost: async (req, res) => {
    const { text } = req.body;
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


    let filePath;

    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    if (!text && !filePath) {
      return res
        .status(400)
        .json({ error: "Either text or image must be provided." });
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
    const userId = req.user ? req.user.userId : null;

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

      // filter out deleted posts
      const filteredPosts = posts.filter((post) => !post.deleted);

      const postsWithIsLiked = await Promise.all(
        filteredPosts.map(async (post) => {
          const isLiked = userId
            ? await prisma.like.findFirst({
                where: { AND: [{ userId: userId }, { postId: post.id }] },
              })
            : false;
          return { ...post, isLiked: Boolean(isLiked) };
        }),
      );

      res.status(200).json(postsWithIsLiked);
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
            include: {
              _count: { select: { likes: true, replies: true } },
              author: {
                select: { displayName: true, avatarUrl: true, username: true },
              },
            },
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

      console.log(userId, id, isLiked);
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

      const post = await prisma.post.update({
        where: { id, authorId },
        data: {
          deleted: true,
          imageUrl: null,
          text: null,
        },
      });

      if (existingPost.imageUrl) {
        const imagePath = path.join(__dirname, "..", existingPost.imageUrl);
        console.log(imagePath);
        try {
          if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath); // Delete the temp file on error
            console.log("Temp file deleted successfully");
          }
        } catch (e) {
          console.error("Error deleting file:", e);
        }
      }

      res.status(200).json(post);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
};

module.exports = PostController;
