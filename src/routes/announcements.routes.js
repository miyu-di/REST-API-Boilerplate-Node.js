import { Router } from "express";
import * as controllers from "../controllers/announcements.controllers.js";
import * as validators from "../validators/announcements.validators.js";

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
 *         description: Пошук за підрядком у назві (title)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *         description: Порядок сортування за датою створення
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Номер сторінки
 *     responses:
 *       200:
 *         description: Успішна відповідь зі списком оголошень та метаданими пагінації
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
 *     summary: Створити нове оголошення
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, price, category, contactInfo]
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
 *                 enum: [sale, service, job, other]
 *               contactInfo:
 *                 type: string
 *                 minLength: 5
 *     responses:
 *       201:
 *         description: Оголошення успішно створено
 *       400:
 *         description: Помилка валідації вхідних даних
 */
router.post(
  "/",
  validators.createAnnouncementValidator,
  controllers.createAnnouncement,
);

/**
 * @swagger
 * /announcements/{id}:
 *   patch:
 *     summary: Частково оновити існуюче оголошення
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
 *         application/json:
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
 *                 enum: [sale, service, job, other]
 *               contactInfo:
 *                 type: string
 *                 minLength: 5
 *     responses:
 *       200:
 *         description: Оголошення успішно оновлено
 *       400:
 *         description: Помилка валідації або порожнє тіло запиту
 *       404:
 *         description: Оголошення не знайдено
 */
router.patch(
  "/:id",
  validators.updateAnnouncementValidator,
  controllers.updateAnnouncement,
);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Видалити оголошення за ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID оголошення
 *     responses:
 *       204:
 *         description: Оголошення успішно видалено (без тіла відповіді)
 *       404:
 *         description: Оголошення не знайдено
 */
router.delete(
  "/:id",
  validators.idParamValidator,
  controllers.deleteAnnouncement,
);

export default router;
