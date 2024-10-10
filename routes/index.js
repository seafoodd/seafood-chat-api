const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  PostController,
  UserController,
  LikeController,
} = require("../controllers");
const {
  authenticateToken,
  optionalAuthenticateToken,
} = require("../middleware/auth");
const path = require("path");

// MULTER CONFIG
const generateRandomFileName = async (originalName) => {
  const { nanoid } = await import("nanoid");
  const ext = path.extname(originalName);
  return `${nanoid()}${ext}`;
};

// TODO: Add file compression
const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "media/post_images");
  },
  filename: async (req, file, cb) => {
    const fileName = await generateRandomFileName(file.originalname)
    cb(null, fileName);
  },
});

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "media/profile_images");
  },
  filename: async (req, file, cb) => {
    const fileName = await generateRandomFileName(file.originalname)
    cb(null, fileName);
  },
});

const uploadPostImage = multer({ storage: postImageStorage });
const uploadProfileImage = multer({ storage: profileImageStorage });

// USERS ROUTES
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/users/current", authenticateToken, UserController.current);
router.get(
  "/users/id/:id",
  optionalAuthenticateToken,
  UserController.getUserById,
);
router.get(
  "/users/username/:username",
  optionalAuthenticateToken,
  UserController.getUserByUsername,
);
router.put(
  "/users/update",
  authenticateToken,
  uploadProfileImage.single("avatar"),
  UserController.updateUser,
);

// POSTS ROUTES
router.post(
  "/posts",
  authenticateToken,
  uploadPostImage.single("image"),
  PostController.createPost,
);
router.get("/posts", optionalAuthenticateToken, PostController.getAllPosts);
router.get("/posts/:id", optionalAuthenticateToken, PostController.getPostById);
router.delete("/posts/:id", authenticateToken, PostController.deletePost);

// LIKES ROUTES
router.post("/likes/:id", authenticateToken, LikeController.likePost);
router.delete("/likes/:id", authenticateToken, LikeController.unlikePost);

module.exports = router;
