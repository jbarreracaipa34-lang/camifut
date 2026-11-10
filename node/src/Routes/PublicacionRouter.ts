import { Router } from "express";
import {
  getPublicaciones,
  getPublicacionPorId,
  postPublicacion,
  putPublicacion,
  deletePublicacion,
} from "../Controller/PublicacionController";
import {
  verificarAutenticacion,
  requerirVendedor,
} from "../Middlewares/AuthMiddleware";

const PublicacionRouter = Router();

// Rutas públicas de consulta
PublicacionRouter.get("/", getPublicaciones);
PublicacionRouter.get("/:id", getPublicacionPorId);

// Rutas protegidas que requieren rol de Vendedor
PublicacionRouter.post("/", verificarAutenticacion, requerirVendedor, postPublicacion);
PublicacionRouter.put("/:id", verificarAutenticacion, requerirVendedor, putPublicacion);
PublicacionRouter.delete("/:id", verificarAutenticacion, requerirVendedor, deletePublicacion);

export { PublicacionRouter };
