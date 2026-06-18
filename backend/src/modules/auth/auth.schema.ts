import Joi from 'joi';

export const googleAuthSchema = Joi.object({
  credential: Joi.string().required(),
});
