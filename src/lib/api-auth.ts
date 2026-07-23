import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSessioneApprovata() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.approved) {
    return null;
  }
  return session;
}
