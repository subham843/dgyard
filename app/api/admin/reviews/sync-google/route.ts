import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to fetch all reviews from Google Places API
// Note: Google Places API Details only returns 5 reviews max
// For all reviews, we need to use multiple API calls or Google My Business API
async function fetchAllReviewsFromPlaces(placeId: string, googleApiKey: string) {
  const allReviews: any[] = [];
  
  // First, try to get reviews using Places API Details
  // This returns up to 5 reviews
  const placesApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,reviews,user_ratings_total&key=${googleApiKey}`;
  
  const response = await fetch(placesApiUrl);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google API Error: ${data.status} - ${data.error_message || "Unknown error"}`);
  }

  if (data.result?.reviews) {
    allReviews.push(...data.result.reviews);
  }

  // If there are more reviews, try to get them using Text Search API
  // We'll search for the place and check for reviews
  const placeName = data.result?.name;
  if (placeName && data.result?.user_ratings_total && data.result.user_ratings_total > 5) {
    try {
      // Use Text Search to potentially get more reviews
      // Note: This might not work perfectly as Text Search also limits reviews
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${googleApiKey}`;
      const textSearchResponse = await fetch(textSearchUrl);
      const textSearchData = await textSearchResponse.json();

      if (textSearchData.status === "OK" && textSearchData.results?.length > 0) {
        // Find the matching place
        const matchingPlace = textSearchData.results.find(
          (place: any) => place.place_id === placeId
        );

        if (matchingPlace && matchingPlace.place_id) {
          // Get details again, sometimes different requests return different reviews
          // This is a workaround - Google Places API limits reviews to 5
          for (let attempt = 0; attempt < 3; attempt++) {
            const detailResponse = await fetch(placesApiUrl);
            const detailData = await detailResponse.json();
            
            if (detailData.result?.reviews) {
              // Merge unique reviews based on author_name and time
              const newReviews = detailData.result.reviews.filter((newReview: any) => {
                return !allReviews.some(
                  (existingReview: any) =>
                    existingReview.author_name === newReview.author_name &&
                    existingReview.time === newReview.time
                );
              });
              
              if (newReviews.length === 0) break; // No new reviews found
              allReviews.push(...newReviews);
              
              // Small delay between requests
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching additional reviews:", error);
      // Continue with what we have
    }
  }

  return allReviews;
}

// Sync reviews from Google My Business / Google Places API
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { placeId, googleApiKey, useScraping = false } = await request.json();

    if (!placeId || !googleApiKey) {
      return NextResponse.json(
        { error: "Place ID and Google API Key are required" },
        { status: 400 }
      );
    }

    let googleReviews: any[] = [];

    if (useScraping) {
      // Option to use scraping service (requires third-party service)
      // For now, we'll use the Places API approach
      return NextResponse.json(
        { 
          error: "Scraping mode requires third-party service setup. Using standard API method.",
          suggestion: "Google Places API is limited to 5 reviews. For all reviews, consider using Google My Business API with OAuth."
        },
        { status: 400 }
      );
    }

    try {
      // Fetch all possible reviews using Places API
      // Note: This is limited to ~5 reviews due to Google's API limitation
      googleReviews = await fetchAllReviewsFromPlaces(placeId, googleApiKey);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to fetch reviews: ${error.message}` },
        { status: 400 }
      );
    }

    if (googleReviews.length === 0) {
      return NextResponse.json(
        { 
          message: "No reviews found. Note: Google Places API typically returns only 5 reviews max. For all reviews, consider using Google My Business API.",
          imported: 0, 
          updated: 0 
        },
        { status: 200 }
      );
    }
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process each review
    for (const googleReview of googleReviews) {
      try {
        // Create unique ID from Google review data
        const googleReviewId = googleReview.time?.toString() || 
                              googleReview.author_url || 
                              `${googleReview.author_name}_${googleReview.rating}_${Date.now()}`;

        const reviewData = {
          name: googleReview.author_name || "Anonymous",
          role: null, // Google doesn't provide role
          content: googleReview.text || "",
          rating: googleReview.rating || 5,
          image: googleReview.profile_photo_url || null,
          source: "Google My Business",
          googleReviewId: googleReviewId,
          verified: googleReview.relative_time_description ? true : false,
          featured: false, // Default to false, admin can set
          active: false, // Default to hidden, admin needs to approve
          order: 0,
        };

        // Check if review already exists (by Google Review ID or by name + source match)
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
          // Update existing review with latest data from Google
          await prisma.review.update({
            where: { id: existingReview.id },
            data: {
              content: reviewData.content,
              rating: reviewData.rating,
              image: reviewData.image || existingReview.image,
              googleReviewId: reviewData.googleReviewId || existingReview.googleReviewId,
              verified: reviewData.verified,
              // Don't update active/featured flags - let admin control those
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

    // Warning message if we got exactly 5 reviews (likely more exist)
    const warningMessage = googleReviews.length === 5 
      ? " Note: Google Places API is limited to 5 reviews per request. If you have more reviews, consider using Google My Business API with OAuth authentication to fetch all reviews."
      : "";

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${imported} imported, ${updated} updated, ${skipped} skipped.${warningMessage}`,
      imported,
      updated,
      skipped,
      total: googleReviews.length,
      warning: googleReviews.length === 5 ? "Limited to 5 reviews. Use Google My Business API for all reviews." : null,
    });
  } catch (error: any) {
    console.error("Error syncing Google reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Google reviews" },
      { status: 500 }
    );
  }
}

