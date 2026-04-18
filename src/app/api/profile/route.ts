import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dati non validi" },
      { status: 400 }
    );
  }
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name.trim() },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json({ user });
}
