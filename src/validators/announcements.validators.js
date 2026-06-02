import { celebrate, Joi, Segments } from "celebrate";

export const getAllValidator = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    search: Joi.string().allow("").optional(),
    sort: Joi.string().valid("newest", "oldest").optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
});

export const idParamValidator = celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
});

export const createAnnouncementValidator = celebrate({
  [Segments.BODY]: Joi.object().keys({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().required(),
    category: Joi.string().valid("sale", "service", "job", "other").required(),
    contactInfo: Joi.string().min(5).required(),
  }),
});

export const updateAnnouncementValidator = celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  [Segments.BODY]: Joi.object()
    .keys({
      title: Joi.string().min(5).max(100).optional(),
      description: Joi.string().min(10).optional(),
      price: Joi.number().positive().optional(),
      category: Joi.string()
        .valid("sale", "service", "job", "other")
        .optional(),
      contactInfo: Joi.string().min(5).optional(),
    })
    .min(1),
});
