import { Router } from "express";
import {
  getModelosCamiseta,
  getModeloCamisetaPorId,
  postModeloCamiseta,
  putModeloCamiseta,
  deleteModeloCamiseta,
} from "../Controller/ModeloCamisetaController";
import {
  verificarAutenticacion,
  requerirAdmin,
} from "../Middlewares/AuthMiddleware";

const ModeloCamisetaRouter = Router();

// Rutas públicas de consulta del catálogo
ModeloCamisetaRouter.get("/", getModelosCamiseta);
ModeloCamisetaRouter.get("/:id", getModeloCamisetaPorId);

// Rutas protegidas exclusivas de Administradores
ModeloCamisetaRouter.post("/", verificarAutenticacion, requerirAdmin, postModeloCamiseta);
ModeloCamisetaRouter.put("/:id", verificarAutenticacion, requerirAdmin, putModeloCamiseta);
ModeloCamisetaRouter.delete("/:id", verificarAutenticacion, requerirAdmin, deleteModeloCamiseta);

export { ModeloCamisetaRouter };
