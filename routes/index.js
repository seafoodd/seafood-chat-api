const express = require("express");
const router = express.Router();
const multer = require("multer");
const {PostController} = require("../controllers");

const uploadDestination = "uploads";

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage });

router.get("/register", (req, res) => {
  res.send("register");
});

// posts routes
router.post("/posts", PostController.createPost)
router.get("/posts", PostController.getAllPosts)

module.exports = router;
