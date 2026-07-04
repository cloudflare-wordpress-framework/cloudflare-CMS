import { defineMiddleware } from "astro:middleware";
export const i18n = defineMiddleware(async (context, next) => { return next(); });
