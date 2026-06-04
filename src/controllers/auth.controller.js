import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import prisma from "../../prisma/client.js"; // Перевір, чи такий шлях до твого клієнта prisma

// Допоміжна функція для генерації пари токенів
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

// Налаштування для HttpOnly куки
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true на продакшені
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів у мілісекундах
};

// 1. РЕЄСТРАЦІЯ
export const register = async (req, res, next) => {
  try {
    const { username, password, name } = req.body;

    // Перевіряємо, чи є вже такий юзер
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return next(
        createHttpError(409, "User with this username already exists"),
      );
    }

    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Створюємо користувача в базі
    const user = await prisma.user.create({
      data: { username, name, password: hashedPassword },
    });

    // Генеруємо токени
    const { accessToken, refreshToken } = generateTokens(user);

    // Зберігаємо refresh token в базу
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    // Саджаємо токен у куку і повертаємо відповідь
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    return res.status(201).json({
      user: { id: user.id, username: user.username, name: user.name },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// 2. ВХІД (ЛОГІН)
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Шукаємо користувача
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    // Перевіряємо пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    // Генеруємо нові токени
    const { accessToken, refreshToken } = generateTokens(user);

    // Ротація токенів під час логіну: видаляємо старі токени юзера (опціонально, але безпечно) і пишемо новий
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
  } catch (error) {
    next(error);
  }
};

// 3. ОНОВЛЕННЯ ТОКЕНА (REFRESH)
export const refresh = async (req, res, next) => {
  try {
    // Шукаємо токен спочатку в куках, потім у тілі
    const tokenFromReq = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!tokenFromReq) {
      return next(createHttpError(401, "Refresh token missing"));
    }

    // Перевіряємо підпис токена
    let decoded;
    try {
      decoded = jwt.verify(tokenFromReq, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(createHttpError(401, "Invalid or expired refresh token"));
    }

    // Шукаємо цей токен в базі даних
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: tokenFromReq },
      include: { user: true },
    });

    if (!dbToken) {
      return next(createHttpError(401, "Refresh token not found in database"));
    }

    // TOKEN ROTATION: Видаляємо використаний токен
    await prisma.refreshToken.delete({ where: { token: tokenFromReq } });

    // Генеруємо нову пару
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      dbToken.user,
    );

    // Записуємо новий токен у базу
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: dbToken.user.id },
    });

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

// 4. ВИХІД (LOGOUT)
export const logout = async (req, res, next) => {
  try {
    const tokenFromReq = req.cookies?.refreshToken || req.body?.refreshToken;

    if (tokenFromReq) {
      // Видаляємо токен з бази (якщо він там є)
      await prisma.refreshToken.deleteMany({ where: { token: tokenFromReq } });
    }

    // Очищаємо куку на клієнті
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// 5. ОТРИМАННЯ ПРОФІЛЮ (ME)
export const getMe = async (req, res, next) => {
  try {
    // req.user прилітає сюди з нашої мідлвари authenticate
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
