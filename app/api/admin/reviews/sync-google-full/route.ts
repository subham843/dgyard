import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Alternative sync endpoint that uses a scraping approach or third-party service
 * This requires additional setup with a scraping service like Outscraper, ScraperAPI, etc.
 * 
 * Note: For production, you should use Google My Business API with proper OAuth authentication
 */

// Sync ALL reviews using scraping service (requires third-party API key)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { placeId, scrapingApiKey, service = "outscraper" } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: "Place ID is required" },
        { status: 400 }
      );
    }

    let googleReviews: any[] = [];

    if (service === "outscraper" && scrapingApiKey) {
      // Outscraper API integration
      try {
        const outscraperUrl = `https://api.outscraper.com/maps/reviews-v3?query=${placeId}&limit=1000&language=en`;
        const response = await fetch(outscraperUrl, {
          headers: {
            "X-API-KEY": scrapingApiKey,
          },
        });

        const data = await response.json();

        if (data.status === "Success" && data.data?.[0]?.reviews_data) {
          googleReviews = data.data[0].reviews_data.map((review: any) => ({
            author_name: review.review_author?.name || review.review_author_name || "Anonymous",
            text: review.review_text || review.review_text || "",
            rating: review.review_rating || review.review_rating || 5,
            profile_photo_url: review.review_author?.profile_photo || null,
            time: review.review_datetime_utc || Date.now(),
            relative_time_description: review.review_datetime_utc || null,
          }));
        }
      } catch (error: any) {
        console.error("Outscraper API error:", error);
        return NextResponse.json(
          { error: `Scraping service error: ${error.message}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { 
          error: "Scraping service API key is required",
          instructions: "To get all reviews, you need to use a scraping service like Outscraper, or implement Google My Business API with OAuth. Place your scraping API key in the 'Scraping API Key' field."
        },
        { status: 400 }
      );
    }

    if (googleReviews.length === 0) {
      return NextResponse.json(
        { message: "No reviews found from scraping service", imported: 0, updated: 0 },
        { status: 200 }
      );
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process each review
    for (const googleReview of googleReviews) {
      try {
        const googleReviewId = googleReview.time?.toString() || 
                              `${googleReview.author_name}_${googleReview.rating}_${Date.now()}`;

        const reviewData = {
          name: googleReview.author_name || "Anonymous",
          role: null,
          content: googleReview.text || "",
          rating: googleReview.rating || 5,
          image: googleReview.profile_photo_url || null,
          source: "Google My Business",
          googleReviewId: googleReviewId,
          verified: googleReview.relative_time_description ? true : false,
          featured: false,
          active: false, // Default to hidden
          order: 0,
        };

        const existingReview = await prisma.review.findFirst({
          where: {
            OR: [
              { googleReviewId: reviewData.googleReviewId },
              {
                AND: [
                  { name: reviewData.name },
                  { source: "Google My Business" },
                ],
              },
            ],
          },
        });

        if (existingReview) {
          await prisma.review.update({
            where: { id: existingReview.id },
            data: {
              content: reviewData.content,
              rating: reviewData.rating,
              image: reviewData.image || existingReview.image,
              googleReviewId: reviewData.googleReviewId || existingReview.googleReviewId,
              verified: reviewData.verified,
            },
          });
          updated++;
        } else {
          await prisma.review.create({
            data: reviewData,
          });
          imported++;
        }
      } catch (error: any) {
        console.error("Error processing review:", error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${imported} imported, ${updated} updated, ${skipped} skipped`,
      imported,
      updated,
      skipped,
      total: googleReviews.length,
    });
  } catch (error: any) {
    console.error("Error syncing Google reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Google reviews" },
      { status: 500 }
    );
  }
}

