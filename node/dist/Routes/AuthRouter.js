"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const AuthController_1 = require("../Controller/AuthController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const AuthRouter = (0, express_1.Router)();
exports.AuthRouter = AuthRouter;
// Rutas públicas de autenticación
AuthRouter.post("/login", AuthController_1.postLogin);
AuthRouter.post("/registro", AuthController_1.postRegistro);
// Rutas protegidas que requieren token válido
AuthRouter.get("/perfil", AuthMiddleware_1.verificarAutenticacion, AuthController_1.getPerfil);
AuthRouter.post("/convertir-en-vendedor", AuthMiddleware_1.verificarAutenticacion, AuthController_1.postConvertirEnVendedor);
// Rutas de administración y consulta de usuarios (Staff: Admin o Superadmin)
AuthRouter.get("/usuarios", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, AuthController_1.getUsuarios);
AuthRouter.post("/crear-admin", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, AuthController_1.postCrearAdmin);
AuthRouter.post("/cambiar-estado", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirAdmin, AuthController_1.postCambiarEstadoUsuario);
// Rutas de uso EXCLUSIVO de Superadmin
AuthRouter.post("/asignar-rol-admin", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirSuperadmin, AuthController_1.postAsignarRolAdmin);
