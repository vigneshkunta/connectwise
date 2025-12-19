import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";

const router = express.Router();

/* SIGNUP */
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash });

  res.json({ message: "Signup successful. Await verification." });
});

/* LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d"
  });

  res.json({
    token,
    user: {
      email: user.email,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin
    }
  });
});

/* VIDEO ACCESS CHECK */
router.get("/video-access", requireAuth, (req, res) => {
  res.json({ ok: true });
});

/* ADMIN: VERIFY USER */
router.post(
  "/admin/verify-user",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, { isVerified: true });
    res.json({ message: "User verified" });
  }
);

/* ADMIN: GET ALL USERS */
router.get(
  "/admin/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const users = await User.find().select("-passwordHash");
    res.json(users);
  }
);

/* ADMIN: VERIFY / UNVERIFY USER */
router.patch(
  "/admin/toggle-verify/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if(user.isAdmin) {
      return res.status(400).json({ message: "Cannot change admin verification status" });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({ message: "Verification toggled" });
  }
);

/* ADMIN: DELETE USER */
router.delete(
  "/admin/delete-user/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  }
);


export default router;
