"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicacionRouter = void 0;
const express_1 = require("express");
const PublicacionController_1 = require("../Controller/PublicacionController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const PublicacionRouter = (0, express_1.Router)();
exports.PublicacionRouter = PublicacionRouter;
// Rutas públicas de consulta
PublicacionRouter.get("/", PublicacionController_1.getPublicaciones);
PublicacionRouter.get("/:id", PublicacionController_1.getPublicacionPorId);
// Rutas protegidas que requieren rol de Vendedor
PublicacionRouter.post("/", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, PublicacionController_1.postPublicacion);
PublicacionRouter.put("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, PublicacionController_1.putPublicacion);
PublicacionRouter.delete("/:id", AuthMiddleware_1.verificarAutenticacion, AuthMiddleware_1.requerirVendedor, PublicacionController_1.deletePublicacion);
