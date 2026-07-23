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
