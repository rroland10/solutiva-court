import type { DisputeCategory, Prisma } from "@prisma/client";

type DisputeStatus = "ACTIVE" | "PENDING" | "RESOLVED" | "CANCELLED";

export function buildDisputeWhere(
  status?: string,
  q?: string,
  category?: string,
  plaintiffId?: string
): Prisma.DisputeWhereInput | undefined {
  const and: Prisma.DisputeWhereInput[] = [];

  if (plaintiffId) {
    and.push({ plaintiffId });
  }

  if (status && status !== "ALL") {
    and.push({ status: status as DisputeStatus });
  }

  if (category && category !== "ALL") {
    and.push({ category: category as DisputeCategory });
  }

  const query = q?.trim();
  if (query) {
    const caseNum = Number(query);
    const or: Prisma.DisputeWhereInput[] = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { plaintiff: { name: { contains: query, mode: "insensitive" } } },
    ];

    if (Number.isFinite(caseNum) && caseNum > 0) {
      or.push({ caseNumber: caseNum });
    }

    and.push({ OR: or });
  }

  if (and.length === 0) return undefined;
  if (and.length === 1) return and[0];
  return { AND: and };
}
