import { google } from "googleapis";
import { prisma } from "../lib/prisma.js";

const enabled = process.env.GOOGLE_INDEXING_ENABLED === "true";

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!email || !privateKey) {
    throw new Error("Google Indexing API credentials not configured");
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
}

export async function requestGoogleIndexing(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<{ success: boolean; message: string }> {
  if (!enabled) {
    return { success: false, message: "Google Indexing API is disabled" };
  }

  try {
    const auth = getAuthClient();
    const indexing = google.indexing({ version: "v3", auth });

    const response = await indexing.urlNotifications.publish({
      requestBody: { url, type },
    });

    await prisma.seoIndexLog.create({
      data: {
        url,
        status: "success",
        response: response.data as object,
      },
    });

    return { success: true, message: `Indexed: ${url}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await prisma.seoIndexLog.create({
      data: {
        url,
        status: "error",
        response: { error: message },
      },
    });

    return { success: false, message };
  }
}

export async function indexDisputePage(caseNumber: number): Promise<void> {
  const dispute = await prisma.dispute.findUnique({
    where: { caseNumber },
    select: { id: true },
  });

  if (!dispute) return;

  const siteUrl =
    process.env.GOOGLE_INDEXING_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://solutivacourt.com";

  const url = `${siteUrl.replace(/\/$/, "")}/disputes/${dispute.id}`;
  await requestGoogleIndexing(url);
}
