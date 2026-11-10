import { Router } from "express";
import {
  postLogin,
  postRegistro,
  getPerfil,
  postConvertirEnVendedor,
  postAsignarRolAdmin,
  postCrearAdmin,
  getUsuarios,
  postCambiarEstadoUsuario,
} from "../Controller/AuthController";
import {
  verificarAutenticacion,
  requerirAdmin,
  requerirSuperadmin,
  requerirStaff,
} from "../Middlewares/AuthMiddleware";

const AuthRouter = Router();

// Rutas públicas de autenticación
AuthRouter.post("/login", postLogin);
AuthRouter.post("/registro", postRegistro);

// Rutas protegidas que requieren token válido
AuthRouter.get("/perfil", verificarAutenticacion, getPerfil);
AuthRouter.post("/convertir-en-vendedor", verificarAutenticacion, postConvertirEnVendedor);

// Rutas de administración y consulta de usuarios (Staff: Admin o Superadmin)
AuthRouter.get("/usuarios", verificarAutenticacion, requerirAdmin, getUsuarios);
AuthRouter.post("/crear-admin", verificarAutenticacion, requerirAdmin, postCrearAdmin);
AuthRouter.post("/cambiar-estado", verificarAutenticacion, requerirAdmin, postCambiarEstadoUsuario);

// Rutas de uso EXCLUSIVO de Superadmin
AuthRouter.post("/asignar-rol-admin", verificarAutenticacion, requerirSuperadmin, postAsignarRolAdmin);

export { AuthRouter };
