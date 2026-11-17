
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId, sessionId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clerk = await clerkClient();

    // Only retrieve sessions belonging to the signed-in user.
    const result = await clerk.sessions.getSessionList({
      userId,
      status: "active",
      limit: 100,
    });

    const sessions = result.data.map((session) => {
      const activity = session.latestActivity;

      return {
        id: session.id,
        isCurrent: session.id === sessionId,

        browser: activity?.browserName || "Unknown browser",

        device: activity?.deviceType ||
          (activity?.isMobile ? "Mobile" : "Desktop"),

        city: activity?.city || "",
        country: activity?.country || "",

        lastActiveAt: session.lastActiveAt
          ? new Date(session.lastActiveAt).toISOString()
          : null,

        createdAt: session.createdAt
          ? new Date(session.createdAt).toISOString()
          : null,
      };
    });

    return NextResponse.json({
      sessions,
      totalCount: result.totalCount,
    });
  } catch (error) {
    console.error("Active sessions error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve active devices." },
      { status: 500 }
    );
  }
}
