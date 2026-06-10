import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import prisma from "../../prisma/client.js"; 

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", 
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};

export const register = async (req, res, next) => {
  try {
    const { username, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return next(
        createHttpError(409, "User with this username already exists"),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, name, password: hashedPassword },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    return res.status(201).json({
      user: { id: user.id, username: user.username, name: user.name },
      accessToken,
      refreshToken,
    });

    logger.info(`Користувач успішно зареєстрований: ${user.username}`);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    return res.json({
      user: { id: user.id, username: user.username, name: user.name },
      accessToken,
      refreshToken,
    });

    logger.info(`Користувач успішно увійшов в систему: ${user.username}`);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const tokenFromReq = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!tokenFromReq) {
      return next(createHttpError(401, "Refresh token missing"));
    }

    let decoded;
    try {
      decoded = jwt.verify(tokenFromReq, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(createHttpError(401, "Invalid or expired refresh token"));
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: tokenFromReq },
      include: { user: true },
    });

    if (!dbToken) {
      return next(createHttpError(401, "Refresh token not found in database"));
    }

    await prisma.refreshToken.delete({ where: { token: tokenFromReq } });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      dbToken.user,
    );

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: dbToken.user.id },
    });

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const tokenFromReq = req.cookies?.refreshToken || req.body?.refreshToken;

    if (tokenFromReq) {
      await prisma.refreshToken.deleteMany({ where: { token: tokenFromReq } });
    }

    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, name: true, createdAt: true }, 
    });

    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
};
