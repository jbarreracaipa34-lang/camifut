export interface UsuarioSesion {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email_verificado?: boolean;
}

export interface TiendaSesion {
  id: string;
  nombre_tienda: string;
  slug: string;
  esta_verificado: boolean;
}

export interface RolesSesion {
  es_comprador: boolean;
  es_vendedor: boolean;
  es_admin: boolean;
  es_superadmin?: boolean;
  es_moderador?: boolean;
  es_soporte?: boolean;
  roles_administrativos: string[];
  rol_principal: "superadmin" | "admin" | "moderador" | "soporte" | "vendedor" | "comprador";
  nivel_jerarquia?: number;
  tienda: TiendaSesion | null;
}

export interface AuthData {
  token: string;
  usuario: UsuarioSesion;
  roles: RolesSesion;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: AuthData;
  errors?: any;
}

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface RegistroDTO {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  nombre_tienda?: string;
}
