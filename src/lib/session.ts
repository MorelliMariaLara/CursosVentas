import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireSession();
  if (session.user.role !== role) redirect("/mis-cursos");
  return session;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
