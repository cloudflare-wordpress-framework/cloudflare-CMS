import { defineMiddleware } from "astro:middleware";
export const security = defineMiddleware(async (context, next) => { return next(); });
