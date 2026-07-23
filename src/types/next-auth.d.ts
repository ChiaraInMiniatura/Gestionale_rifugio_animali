// Augmentazione dei tipi di Auth.js: per default i tipi User/Session/JWT
// di next-auth conoscono solo i campi standard (name, email, image).
// Qui si dichiarano i campi custom aggiunti nei callback di
// src/lib/auth.ts (id, role, approved), così il resto del codice può
// leggerli da `session.user` con il tipo corretto invece di `any`.

import type { Role } from "@/generated/prisma/enums";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    approved: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: Role;
      approved: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    approved: boolean;
  }
}
