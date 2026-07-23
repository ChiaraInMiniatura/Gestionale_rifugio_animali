// Wrapper dei provider React globali montati nel root layout: per ora
// solo SessionProvider di Auth.js, che rende useSession() disponibile a
// qualunque client component sotto (NavLinks, LogoutButton, ecc.).

"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
