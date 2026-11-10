"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zCleanOptionalString = exports.zCleanString = void 0;
exports.sanitizeText = sanitizeText;
const zod_1 = require("zod");
/**
 * Sanitiza cadenas de texto eliminando etiquetas HTML peligrosas y recortando espacios.
 */
function sanitizeText(val) {
    if (typeof val !== "string")
        return "";
    return val
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
}
/**
 * Zod helper para cadenas sanitizadas y recortadas automáticamente.
 */
const zCleanString = (min = 1, max = 2000) => zod_1.z.string()
    .transform((val) => sanitizeText(val))
    .refine((val) => val.length >= min, {
    message: `El campo debe tener al menos ${min} caracteres después de limpiar espacios.`,
})
    .refine((val) => val.length <= max, {
    message: `El campo no puede exceder los ${max} caracteres.`,
});
exports.zCleanString = zCleanString;
const zCleanOptionalString = (max = 2000) => zod_1.z.string()
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val) : null));
exports.zCleanOptionalString = zCleanOptionalString;
