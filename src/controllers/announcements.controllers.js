import prisma from "../../prisma/client.js";
import createHttpError from "http-errors";

// GET /announcements (Публічний)
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
      pagination: {
        total,
        page: currentPage,
        totalPages,
        perPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /announcements/:id (Публічний)
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

// POST /announcements (Захищений)
export const createAnnouncement = async (req, res, next) => {
  try {
    // Беремо дані з тіла запиту + userId з розшифрованого токена (req.user)
    const newAnnouncement = await prisma.announcement.create({
      data: {
        ...req.body,
        userId: req.user.id,
      },
    });

    return res.status(201).json(newAnnouncement);
  } catch (error) {
    next(error);
  }
};

// PATCH /announcements/:id (Захищений + Перевірка власності)
export const updateAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // 1. Спочатку шукаємо оголошення в базі
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    // Якщо не знайшли — віддаємо 404 через http-errors
    if (!announcement) {
      return next(createHttpError(404, "Announcement not found"));
    }

    // 2. Перевіряємо Ownership: чи збігається автор із поточним юзером
    if (announcement.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // 3. Якщо все ок — оновлюємо дані
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: req.body,
    });

    return res.json(updatedAnnouncement);
  } catch (error) {
    next(error);
  }
};

// DELETE /announcements/:id (Захищений + Перевірка власності)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // 1. Спочатку шукаємо оголошення
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return next(createHttpError(404, "Announcement not found"));
    }

    // 2. Перевіряємо Ownership
    if (announcement.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // 3. Якщо все ок — видаляємо
    await prisma.announcement.delete({
      where: { id },
    });

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
};
