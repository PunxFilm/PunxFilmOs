import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskCreateSchema } from "@/lib/validations";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { film: true, submission: { include: { festivalEdition: { include: { festivalMaster: true } } } } },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const task = await prisma.task.create({ data: parsed.data });
  return NextResponse.json(task, { status: 201 });
}
