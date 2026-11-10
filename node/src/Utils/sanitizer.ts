import { z } from "zod";

/**
 * Sanitiza cadenas de texto eliminando etiquetas HTML peligrosas y recortando espacios.
 */
export function sanitizeText(val: string | null | undefined): string {
  if (typeof val !== "string") return "";
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
export const zCleanString = (min: number = 1, max: number = 2000) =>
  z.string()
    .transform((val) => sanitizeText(val))
    .refine((val) => val.length >= min, {
      message: `El campo debe tener al menos ${min} caracteres después de limpiar espacios.`,
    })
    .refine((val) => val.length <= max, {
      message: `El campo no puede exceder los ${max} caracteres.`,
    });

export const zCleanOptionalString = (max: number = 2000) =>
  z.string()
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val) : null));
