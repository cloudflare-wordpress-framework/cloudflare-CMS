import { defineMiddleware } from "astro:middleware";
export const auth = defineMiddleware(async (context, next) => { return next(); });
