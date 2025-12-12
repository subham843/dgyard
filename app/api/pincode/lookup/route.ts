import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { error: "Invalid pincode. Please enter a 6-digit pincode." },
        { status: 400 }
      );
    }

    // Use PostalPinCode.in API (free, no auth required)
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch pincode data");
    }

    const data = await response.json();
    
    if (data[0]?.Status === "Error" || !data[0]?.PostOffice || data[0]?.PostOffice.length === 0) {
      return NextResponse.json(
        { error: "Pincode not found" },
        { status: 404 }
      );
    }

    // Extract city, state, and country from the first post office
    const postOffice = data[0].PostOffice[0];
    const result = {
      city: postOffice.District || postOffice.Name || "",
      state: postOffice.State || "",
      country: "India",
      district: postOffice.District || "",
      postOffice: postOffice.Name || "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching pincode data:", error);
    return NextResponse.json(
      { error: "Failed to fetch pincode information" },
      { status: 500 }
    );
  }
}

