import { Routes } from "@angular/router";
import { CatalogoComponent } from "./features/catalogo/catalogo.component";
import { DetalleCamisetaComponent } from "./features/detalle-camiseta/detalle-camiseta.component";
import { PublicarCamisetaComponent } from "./features/publicar/publicar-camiseta.component";
import { CarritoComponent } from "./features/carrito/carrito.component";
import { PedidosComponent } from "./features/pedidos/pedidos.component";
import { AdminDashboardComponent } from "./features/admin/admin-dashboard.component";
import { VendedorDashboardComponent } from "./features/vendedor/vendedor-dashboard.component";
import { adminGuard, vendedorGuard, authGuard } from "./core/guards/role.guard";

export const routes: Routes = [
  { path: "", redirectTo: "catalogo", pathMatch: "full" },
  { path: "catalogo", component: CatalogoComponent, runGuardsAndResolvers: "always" },
  { path: "camiseta/:id", component: DetalleCamisetaComponent },
  { path: "publicar", component: PublicarCamisetaComponent, canActivate: [vendedorGuard] },
  { path: "publicar/:id", component: PublicarCamisetaComponent, canActivate: [vendedorGuard] },
  { path: "editar-camiseta/:id", component: PublicarCamisetaComponent, canActivate: [vendedorGuard] },
  { path: "carrito", component: CarritoComponent },
  { path: "pedidos", component: PedidosComponent, canActivate: [authGuard] },
  { path: "admin", component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: "vendedor", component: VendedorDashboardComponent, canActivate: [vendedorGuard] },
  { path: "**", redirectTo: "catalogo" }
];
