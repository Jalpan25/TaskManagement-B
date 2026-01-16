const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const {apiLimiter}=require("../middleware/rateLimiter.middleware")
const router = express.Router();

router.post("/register",register);
router.post("/login",login);

module.exports = router;
