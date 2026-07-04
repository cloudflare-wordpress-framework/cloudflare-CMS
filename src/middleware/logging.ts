import { defineMiddleware } from "astro:middleware";
export const logging = defineMiddleware(async (context, next) => { return next(); });
