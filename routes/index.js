const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
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
const fs = require("fs");

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
    const fileName = await generateRandomFileName(file.originalname);
    cb(null, fileName);
  },
});

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "media/profile_images");
  },
  filename: async (req, file, cb) => {
    const fileName = await generateRandomFileName(file.originalname);
    cb(null, fileName);
  },
});

const uploadPostImage = multer({ storage: postImageStorage });
const uploadProfileImage = multer({ storage: profileImageStorage });

const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  const filePath = req.file.path;
  const tempFilePath = `${filePath}.tmp`;

  try {
    const oldSize = fs.statSync(filePath).size;

    const buffer = await sharp(filePath)
      .resize(800) // Resize to a width of 800px, maintaining aspect ratio
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toBuffer();

    fs.writeFileSync(tempFilePath, buffer);
    fs.renameSync(tempFilePath, filePath);

    const newSize = fs.statSync(filePath).size;

    console.log(
      `compressed image, old image size: ${oldSize}, new image size: ${newSize}`
    );
    next();
  } catch (error) {
    console.error("Error compressing image:", error);
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath); // Delete the temp file on error
        console.log("Temp file deleted successfully");
      }
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath); // Delete the original file on error
        console.log("File deleted successfully");
      }
    } catch (unlinkError) {
      console.error("Error deleting file:", unlinkError);
    }
    res.status(500).json({ error: "Error compressing image." });
  }
};
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
  compressImage,
  UserController.updateUser,
);

// POSTS ROUTES
router.post(
  "/posts",
  authenticateToken,
  uploadPostImage.single("image"),
  compressImage,
  PostController.createPost,
);
router.get("/posts", optionalAuthenticateToken, PostController.getAllPosts);
router.get("/posts/:id", optionalAuthenticateToken, PostController.getPostById);
router.delete("/posts/:id", authenticateToken, PostController.deletePost);

// LIKES ROUTES
router.post("/likes/:id", authenticateToken, LikeController.likePost);
router.delete("/likes/:id", authenticateToken, LikeController.unlikePost);

module.exports = router;
