import { Router } from "express";
import {
  getCarritoPorUsuario,
  postItemCarrito,
  deleteItemCarrito,
  deleteVaciarCarrito,
} from "../Controller/CarritoController";
import { verificarAutenticacion } from "../Middlewares/AuthMiddleware";

const CarritoRouter = Router();

// Obtener carrito (requiere auth para seguridad)
CarritoRouter.get("/:usuarioId", verificarAutenticacion, getCarritoPorUsuario);
// Agregar item al carrito
CarritoRouter.post("/item", verificarAutenticacion, postItemCarrito);
// Eliminar item
CarritoRouter.delete("/item/:id", verificarAutenticacion, deleteItemCarrito);
// Vaciar carrito
CarritoRouter.delete("/vaciar/:usuarioId", verificarAutenticacion, deleteVaciarCarrito);

export { CarritoRouter };
