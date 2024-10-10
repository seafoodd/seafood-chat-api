const { prisma } = require("../prisma/prisma-client");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserController = {
  register: async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    try {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(400).json({ error: "Email is already taken." });
      }
      // TODO: email verification

      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return res.status(400).json({ error: "Username is already taken." });
      }

      const displayName = username;

      // TODO: password complexity check
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          displayName,
        },
      });

      res.status(201).json(user);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  login: async (req, res) => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    try {
      const user = await prisma.user.findUnique({
        where: email ? { email } : { username },
      });

      if (!user) {
        return res
          .status(404)
          .json({ error: "Sorry, we could not find your account." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Wrong password!" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);

      res.status(200).json({ token });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.userId : null;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const isFollowing = userId
        ? await prisma.follows.findFirst({
            where: {
              AND: [{ followerId: userId }, { followingId: id }],
            },
          })
        : false;

      res.status(200).json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  getUserByUsername: async (req, res) => {
    const { username } = req.params;
    const userId = req.user ? req.user.userId : null;

    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const isFollowing = userId
        ? await prisma.follows.findFirst({
            where: {
              AND: [{ followerId: userId }, { followingId: user.id }],
            },
          })
        : false;

      res.status(200).json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  updateUser: async (req, res) => {
    let { displayName, username, password, email, location, dateOfBirth } =
      req.body;
    const id = req.user.userId;

    // TODO: add new email verification, then support for file avatars instead of urls, and then maybe add a limit for
    //       username changing (like you can only change it once in a month or something)

    let filePath;

    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    try {
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Email is already taken." });
        }
      }
      if (username) {
        const existingUser = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Username is already taken." });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          displayName,
          username,
          password,
          email,
          location,
          dateOfBirth,
          avatarUrl: filePath ? `/${filePath}` : undefined,
        },
      });

      res.status(200).json(user);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          followers: { include: { follower: true } },
          following: { include: { following: true } },
        },
      });

      if (!user) {
        return res.status(400).json({ error: "User not found." });
      }

      res.status(200).json(user);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
};

module.exports = UserController;
