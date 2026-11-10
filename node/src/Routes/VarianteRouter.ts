import { Router } from "express";
import {
  getVariantesPorPublicacion,
  postVariante,
  putVariante,
  deleteVariante,
} from "../Controller/VarianteController";
import {
  verificarAutenticacion,
  requerirVendedor,
} from "../Middlewares/AuthMiddleware";

const VarianteRouter = Router();

VarianteRouter.get("/publicacion/:publicacionId", getVariantesPorPublicacion);
// Requiere autenticacion de vendedor para crear/editar/eliminar variantes
VarianteRouter.post("/", verificarAutenticacion, requerirVendedor, postVariante);
VarianteRouter.put("/:id", verificarAutenticacion, requerirVendedor, putVariante);
VarianteRouter.delete("/:id", verificarAutenticacion, requerirVendedor, deleteVariante);

export { VarianteRouter };
