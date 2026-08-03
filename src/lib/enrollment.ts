import { prisma } from "@/lib/prisma";

export async function userOwnsCourse(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });
  return enrollment?.status === "ACTIVE";
}

export async function getCourseProgress(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: { lessons: true },
      },
    },
  });
  if (!course) return null;

  const lessons = course.modules.flatMap((m) => m.lessons);
  const total = lessons.length;
  if (total === 0) {
    return { total: 0, completed: 0, percent: 0, allCompleted: false };
  }

  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessons.map((l) => l.id) },
      completed: true,
    },
  });

  const completed = progress.length;
  const percent = Math.round((completed / total) * 100);
  return {
    total,
    completed,
    percent,
    allCompleted: completed === total,
  };
}
