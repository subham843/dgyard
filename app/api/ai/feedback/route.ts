import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateQualityScore } from "@/lib/ai-learning";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { conversationId, rating, correctedResponse } = await request.json();

    if (!conversationId || !rating) {
      return NextResponse.json(
        { error: "conversationId and rating are required" },
        { status: 400 }
      );
    }

    // Update quality score
    const success = await updateQualityScore(
      conversationId,
      rating,
      correctedResponse
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Feedback recorded successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to record feedback" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in feedback API:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}

