"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarritoRouter = void 0;
const express_1 = require("express");
const CarritoController_1 = require("../Controller/CarritoController");
const AuthMiddleware_1 = require("../Middlewares/AuthMiddleware");
const CarritoRouter = (0, express_1.Router)();
exports.CarritoRouter = CarritoRouter;
// Obtener carrito (requiere auth para seguridad)
CarritoRouter.get("/:usuarioId", AuthMiddleware_1.verificarAutenticacion, CarritoController_1.getCarritoPorUsuario);
// Agregar item al carrito
CarritoRouter.post("/item", AuthMiddleware_1.verificarAutenticacion, CarritoController_1.postItemCarrito);
// Eliminar item
CarritoRouter.delete("/item/:id", AuthMiddleware_1.verificarAutenticacion, CarritoController_1.deleteItemCarrito);
// Vaciar carrito
CarritoRouter.delete("/vaciar/:usuarioId", AuthMiddleware_1.verificarAutenticacion, CarritoController_1.deleteVaciarCarrito);
