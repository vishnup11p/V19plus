import Joi from 'joi';

export const listContentSchema = Joi.object({
  type: Joi.string().valid('MOVIE', 'SERIES', 'DOCUMENTARY', 'SHORT'),
  genre: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export const createContentSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().required(),
  description: Joi.string().required(),
  type: Joi.string().valid('MOVIE', 'SERIES', 'DOCUMENTARY', 'SHORT').required(),
  genre: Joi.array().items(Joi.string()).min(1).required(),
  tags: Joi.array().items(Joi.string()).default([]),
  releaseYear: Joi.number().integer().min(1900).max(2100).required(),
  rating: Joi.string().required(),
  imdbScore: Joi.number().min(0).max(10),
  duration: Joi.number().integer().min(1),
  thumbnailUrl: Joi.string().uri().required(),
  backdropUrl: Joi.string().uri().required(),
  videoUrl: Joi.string().uri(),
  trailerUrl: Joi.string().uri(),
  isOriginal: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false),
  isPublished: Joi.boolean().default(true),
});

export const updateContentSchema = createContentSchema.fork(
  ['title', 'slug', 'description', 'type', 'genre', 'releaseYear', 'rating', 'thumbnailUrl', 'backdropUrl'],
  (schema) => schema.optional()
);
