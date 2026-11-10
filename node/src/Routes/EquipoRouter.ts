import { Router } from "express";
import {
  getEquipos,
  getEquipoPorId,
  postEquipo,
  putEquipo,
  deleteEquipo,
} from "../Controller/EquipoController";

const EquipoRouter = Router();

EquipoRouter.get("/", getEquipos);
EquipoRouter.get("/:id", getEquipoPorId);
EquipoRouter.post("/", postEquipo);
EquipoRouter.put("/:id", putEquipo);
EquipoRouter.delete("/:id", deleteEquipo);

export { EquipoRouter };
