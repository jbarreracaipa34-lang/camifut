import { Router } from "express";
import {
  getUsuarios,
  getUsuarioPorId,
  postUsuario,
  putUsuario,
  deleteUsuario,
} from "../Controller/UsuarioController";
import {
  verificarAutenticacion,
  requerirAdmin,
  requerirSuperadmin,
} from "../Middlewares/AuthMiddleware";

const UsuarioRouter = Router();

// Consulta protegida para staff
UsuarioRouter.get("/", verificarAutenticacion, requerirAdmin, getUsuarios);
UsuarioRouter.get("/:id", verificarAutenticacion, getUsuarioPorId);

// Creación de usuario (público o administrado)
UsuarioRouter.post("/", postUsuario);

// Modificación de usuario: autenticado (propio perfil o admin subordinado)
UsuarioRouter.put("/:id", verificarAutenticacion, putUsuario);

// Baja o eliminación de usuario: protegido según jerarquía (Superadmin o Admin sobre subordinados)
UsuarioRouter.delete("/:id", verificarAutenticacion, requerirAdmin, deleteUsuario);

export { UsuarioRouter };
