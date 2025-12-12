import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, refreshGMBToken } from "@/lib/gmb-auth";

/**
 * GET - Fetch all reviews from Google My Business
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get settings with GMB tokens
    const settings = await prisma.settings.findFirst();

    if (!settings?.gmbAccessToken || !settings?.gmbRefreshToken) {
      return NextResponse.json(
        { error: "Google My Business not connected. Please connect your account first." },
        { status: 400 }
      );
    }

    // Get valid access token (refresh if needed)
    let accessToken = await getValidAccessToken(
      settings.gmbAccessToken,
      settings.gmbRefreshToken,
      settings.gmbTokenExpiry,
      async (newToken: string, newExpiry: Date) => {
        await prisma.settings.update({
          where: { id: settings.id },
          data: {
            gmbAccessToken: newToken,
            gmbTokenExpiry: newExpiry,
          },
        });
      }
    );

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get valid access token. Please reconnect your Google My Business account." },
        { status: 401 }
      );
    }

    // Get location ID from settings or fetch locations
    let locationId = settings.gmbLocationId;

    if (!locationId) {
      // Fetch account and location
      const accountsResponse = await fetch(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!accountsResponse.ok) {
        const error = await accountsResponse.text();
        throw new Error(`Failed to fetch accounts: ${error}`);
      }

      const accountsData = await accountsResponse.json();
      
      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        return NextResponse.json(
          { error: "No Google My Business accounts found" },
          { status: 400 }
        );
      }

      // Get first account
      const accountName = accountsData.accounts[0].name;

      // Fetch locations for this account
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!locationsResponse.ok) {
        const error = await locationsResponse.text();
        throw new Error(`Failed to fetch locations: ${error}`);
      }

      const locationsData = await locationsResponse.json();

      if (!locationsData.locations || locationsData.locations.length === 0) {
        return NextResponse.json(
          { error: "No locations found in your Google My Business account" },
          { status: 400 }
        );
      }

      locationId = locationsData.locations[0].name;

      // Save location ID to settings
      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          gmbLocationId: locationId,
          gmbAccountName: accountName,
        },
      });
    }

    // Fetch all reviews using Google My Business API
    // Note: GMB API uses pagination, we need to fetch all pages
    let allReviews: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const url = `https://mybusiness.googleapis.com/v4/${locationId}/reviews${pageToken ? `?pageToken=${pageToken}` : ""}`;
      
      const reviewsResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!reviewsResponse.ok) {
        const error = await reviewsResponse.text();
        throw new Error(`Failed to fetch reviews: ${error}`);
      }

      const reviewsData = await reviewsResponse.json();
      
      if (reviewsData.reviews) {
        allReviews = allReviews.concat(reviewsData.reviews);
      }

      pageToken = reviewsData.nextPageToken;
    } while (pageToken);

    return NextResponse.json({
      reviews: allReviews,
      locationId,
      total: allReviews.length,
    });
  } catch (error: any) {
    console.error("Error fetching GMB reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST - Sync all reviews from Google My Business to database
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // First, fetch reviews from GMB
    const reviewsResponse = await GET();
    const reviewsData = await reviewsResponse.json();

    if (!reviewsResponse.ok) {
      return reviewsResponse;
    }

    const gmbReviews = reviewsData.reviews || [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process each review
    for (const gmbReview of gmbReviews) {
      try {
        // Create unique ID from GMB review
        const googleReviewId = gmbReview.name || // GMB review name (e.g., "locations/123/reviews/456")
                              `${gmbReview.reviewId}_${gmbReview.createTime}`;

        // Parse rating from GMB API response
        let rating = 5;
        if (gmbReview.starRating) {
          if (typeof gmbReview.starRating === "string") {
            rating = gmbReview.starRating === "FIVE" ? 5 :
                     gmbReview.starRating === "FOUR" ? 4 :
                     gmbReview.starRating === "THREE" ? 3 :
                     gmbReview.starRating === "TWO" ? 2 :
                     gmbReview.starRating === "ONE" ? 1 : 5;
          } else if (typeof gmbReview.starRating === "number") {
            rating = gmbReview.starRating;
          }
        }

        const reviewData = {
          name: gmbReview.reviewer?.displayName || 
                gmbReview.reviewer?.profilePhotoUrl?.split("/").pop()?.split("=")[0] || 
                "Anonymous",
          role: null,
          content: gmbReview.comment || gmbReview.text || "",
          rating: rating,
          image: gmbReview.reviewer?.profilePhotoUrl || null,
          source: "Google My Business",
          googleReviewId: googleReviewId,
          verified: true, // GMB reviews are verified
          featured: false,
          active: false, // Default to hidden
          order: 0,
        };

        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: {
            OR: [
              { googleReviewId: reviewData.googleReviewId },
              {
                AND: [
                  { name: reviewData.name },
                  { source: "Google My Business" },
                  { content: reviewData.content.substring(0, 100) }, // Partial match
                ],
              },
            ],
          },
        });

        if (existingReview) {
          // Update existing review
          await prisma.review.update({
            where: { id: existingReview.id },
            data: {
              content: reviewData.content,
              rating: reviewData.rating,
              image: reviewData.image || existingReview.image,
              googleReviewId: reviewData.googleReviewId || existingReview.googleReviewId,
              verified: true,
            },
          });
          updated++;
        } else {
          // Create new review
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
      total: gmbReviews.length,
    });
  } catch (error: any) {
    console.error("Error syncing GMB reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync reviews" },
      { status: 500 }
    );
  }
}

