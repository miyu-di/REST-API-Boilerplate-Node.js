import prisma from "../../prisma/client.js";
import createHttpError from "http-errors";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";
import logger from "../logger.js";

export const getAllAnnouncements = async (req, res, next) => {
  try {
    const { search, sort, page } = req.query;
    const currentPage = Number(page) || 1;
    const perPage = 10;
    const skip = (currentPage - 1) * perPage;

    const where = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    const orderBy =
      sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      prisma.announcement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return res.json({
      data,
      pagination: { total, page: currentPage, totalPages, perPage },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncementById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const announcement = await prisma.announcement.findUniqueOrThrow({
      where: { id },
    });
    return res.json(announcement);
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, price, category, contactInfo } = req.body;
    let imageUrl = null;

    if (req.file) {
      logger.info(
        "Початок завантаження фото для нового оголошення на Cloudinary...",
      );
      imageUrl = await uploadToCloudinary(req.file.path);
      logger.info(`Фото успішно завантажено. URL: ${imageUrl}`);
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        description,
        price: price ? parseFloat(price) : 0, 
        category,
        contactInfo,
        imageUrl, 
        userId: req.user.id,
      },
    });

    logger.info(
      `Користувач ID ${req.user.id} успішно створив оголошення з ID ${newAnnouncement.id}`,
    );
    return res.status(201).json(newAnnouncement);
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      return next(createHttpError(404, "Announcement not found"));
    }

    if (announcement.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updateData = { ...req.body };

    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }

    if (req.file) {
      logger.info(
        `Початок завантаження нового фото для оголошення ID ${id}...`,
      );
      updateData.imageUrl = await uploadToCloudinary(req.file.path);
      logger.info(`Нове фото завантажено. URL: ${updateData.imageUrl}`);
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    logger.info(
      `Оголошення ID ${id} успішно оновлено користувачем ID ${req.user.id}`,
    );
    return res.json(updatedAnnouncement);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      return next(createHttpError(404, "Announcement not found"));
    }

    if (announcement.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.announcement.delete({ where: { id } });

    logger.info(`Оголошення ID ${id} видалено користувачем ID ${req.user.id}`);
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
};
