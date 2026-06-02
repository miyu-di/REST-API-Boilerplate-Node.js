import prisma from "../../prisma/client.js";

export const getAllAnnouncements = async (req, res) => {
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

  res.json({
    data,
    pagination: {
      total,
      page: currentPage,
      totalPages,
      perPage,
    },
  });
};

export const getAnnouncementById = async (req, res) => {
  const id = Number(req.params.id);

  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id },
  });

  res.json(announcement);
};

export const createAnnouncement = async (req, res) => {
  const newAnnouncement = await prisma.announcement.create({
    data: req.body,
  });

  res.status(201).json(newAnnouncement);
};

export const updateAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  const updatedAnnouncement = await prisma.announcement.update({
    where: { id },
    data: req.body,
  });

  res.json(updatedAnnouncement);
};

export const deleteAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  await prisma.announcement.delete({
    where: { id },
  });

  res.status(204).end();
};
