import { Router } from "express";
import * as controllers from "../controllers/announcements.controller.js";
import * as validators from "../validators/announcements.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from "../middleware/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Отримати список оголошень з фільтрацією, сортуванням та пагінацією
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Пошук за підрядком у назві
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - newest
 *             - oldest
 *         description: Порядок сортування
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Номер сторінки
 *     responses:
 *       200:
 *         description: Успішна відповідь зі списком оголошень
 */
router.get("/", validators.getAllValidator, controllers.getAllAnnouncements);

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Отримати оголошення за його ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID оголошення
 *     responses:
 *       200:
 *         description: Повна інформація про оголошення
 *       404:
 *         description: Оголошення не знайдено
 */
router.get(
  "/:id",
  validators.idParamValidator,
  controllers.getAnnouncementById,
);

/**
 * @swagger
  * /announcements:
 *   post:
 *     summary: Створити нове оголошення (multipart/form-data)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - category
 *               - contactInfo
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *               category:
 *                 type: string
 *                 enum:
 *                   - sale
 *                   - service
 *                   - job
 *                   - other
 *               contactInfo:
 *                 type: string
 *                 minLength: 5
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Файл зображення оголошення (опціонально)
 *     responses:
 *       201:
 *         description: Оголошення успішно створено
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Неавторизований користувач
 */
router.post(
  "/",
  authenticate,
  uploadMiddleware.single("photo"),
  validators.createAnnouncementValidator,
  controllers.createAnnouncement,
);

/**
 * @swagger
 * /announcements/{id}:
 *   patch:
 *     summary: Частково оновити існуюче оголошення (multipart/form-data)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID оголошення
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *               category:
 *                 type: string
 *                 enum:
 *                   - sale
 *                   - service
 *                   - job
 *                   - other
 *               contactInfo:
 *                 type: string
 *                 minLength: 5
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Нове фото для заміни (опціонально)
 *     responses:
 *       200:
 *         description: Оголошення успішно оновлено
 *       400:
 *         description: Помилка валідації
 *       401:
 *         description: Неавторизований користувач
 *       403:
 *         description: Доступ заборонено
 *       404:
 *         description: Оголошення не знайдено
 */
router.patch(
  "/:id",
  authenticate,
  uploadMiddleware.single("photo"),
  validators.updateAnnouncementValidator,
  controllers.updateAnnouncement,
);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Видалити оголошення за ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID оголошення
 *     responses:
 *       204:
 *         description: Оголошення успішно видалено
 *       401:
 *         description: Неавторизований користувач
 *       403:
 *         description: Доступ заборонено
 *       404:
 *         description: Оголошення не знайдено
 */
router.delete(
  "/:id",
  authenticate,
  validators.idParamValidator,
  controllers.deleteAnnouncement,
);

export default router;
