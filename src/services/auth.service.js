const prisma = require("../prisma");
const { hashPassword, comparePassword } = require("../utils/hash.util");
const { generateToken } = require("../utils/jwt.util");
const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.validation");

exports.register = async (data) => {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    throw {
      status: 400,
      message: parsed.error.issues[0].message,
    };
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw { status: 400, message: "Email already registered" };
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const { password: _, ...safeUser } = user;
  return safeUser;
};

exports.login = async (data) => {


  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    
    throw {
      status: 400,
      message: parsed.error.issues[0].message,
    };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw { status: 400, message: "Invalid credentials" };
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw { status: 400, message: "Invalid credentials" };
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
