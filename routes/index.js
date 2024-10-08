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

const uploadDestination = "uploads";

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage });

// user routes
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
router.put("/users/update", authenticateToken, UserController.updateUser);

// posts routes
router.post("/posts", authenticateToken, PostController.createPost);
router.get("/posts", optionalAuthenticateToken, PostController.getAllPosts);
router.get("/posts/:id", optionalAuthenticateToken, PostController.getPostById);
router.delete("/posts/:id", authenticateToken, PostController.deletePost);

// likes routes
router.post("/likes/:id", authenticateToken, LikeController.likePost);
router.delete("/likes/:id", authenticateToken, LikeController.unlikePost);

module.exports = router;
