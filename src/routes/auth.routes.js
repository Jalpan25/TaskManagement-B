const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const router = express.Router();


//register of user or admin
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //Validate fields all fields are required
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    //if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    //removing password before sending
    const { password: _, ...safeUser } = user;

    res.status(201).json(safeUser);
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// login via email and password
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  
  if (!user)
  {
    return res.status(400).json({ error: "Invalid credentials" });
  } 

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
  {
      return res.status(400).json({ error: "Invalid credentials" });
  } 

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET
  );

  res.json({
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});

});

module.exports = router;
