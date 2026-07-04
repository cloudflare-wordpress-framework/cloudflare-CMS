import { sequence } from "astro:middleware";
import { auth } from "./auth";
import { logging } from "./logging";
import { security } from "./security";
import { i18n } from "./i18n";

export const onRequest = sequence(security, logging, i18n, auth);
