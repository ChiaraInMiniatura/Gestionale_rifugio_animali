import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const ADMIN_PREFIX = "/admin";

export async function proxy(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.redirect(loginUrl);
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { approved: true, role: true },
    });
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  if (!user || !user.approved) {
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith(ADMIN_PREFIX) && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/animali/:path*"],
};
