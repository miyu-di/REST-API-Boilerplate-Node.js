import { Router } from "express";
import * as controllers from "../controllers/auth.controller.js";
import * as validators from "../validators/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *                 minLength: 2
 *     responses:
 *       201:
 *         description: Успішна реєстрація, повернуто токени
 *       409:
 *         description: Користувач з таким username вже існує
 */
router.post("/register", validators.registerValidator, controllers.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вхід користувача (отримання токенів)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успішний вхід
 *       401:
 *         description: Невірний логін або пароль
 */
router.post("/login", validators.loginValidator, controllers.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Оновлення access токена через refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Токени успішно оновлено
 *       401:
 *         description: Невалідний або прострочений refresh токен
 */
router.post("/refresh", validators.refreshValidator, controllers.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Вихід із системи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успішний вихід
 */
router.post("/logout", controllers.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Отримання профілю поточного користувача
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дані профілю користувача
 *       401:
 *         description: Неавторизовано
 */
router.get("/me", authenticate, controllers.getMe);

export default router;
