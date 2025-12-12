import { NextRequest, NextResponse } from "next/server";

// This route handles short URL codes and redirects to quotation page with decoded parameters
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    if (!code) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 400 }
      );
    }

    try {
      // Decode base64 code back to parameters
      // Replace URL-safe characters back to base64 format
      let base64Code = code.replace(/-/g, "+").replace(/_/g, "/");
      
      // Add padding if needed (base64 requires length to be multiple of 4)
      const padding = 4 - (base64Code.length % 4);
      if (padding !== 4) {
        base64Code += "=".repeat(padding);
      }
      
      // Decode from base64
      const jsonString = Buffer.from(base64Code, "base64").toString("utf-8");
      const params = JSON.parse(jsonString);
      
      // Reconstruct URLSearchParams from decoded parameters
      const searchParams = new URLSearchParams();
      if (params.b) searchParams.append("brandId", params.b);
      if (params.c) searchParams.append("categoryId", params.c);
      if (params.r) searchParams.append("territoryCategoryId", params.r);
      if (params.i) searchParams.append("indoorCount", params.i);
      if (params.o) searchParams.append("outdoorCount", params.o);
      if (params.h) searchParams.append("hddTerritoryCategoryId", params.h);
      if (params.d) searchParams.append("recordingDays", params.d);
      if (params.w) searchParams.append("wiringMeters", params.w);
      searchParams.append("download", "pdf");
      
      // Redirect to quotation page with decoded parameters
      const redirectUrl = new URL(`/quotation?${searchParams.toString()}`, request.url);
      return NextResponse.redirect(redirectUrl);
    } catch (decodeError) {
      console.error("Error decoding short code:", decodeError);
      // Fallback: redirect to quotation page
      return NextResponse.redirect(new URL("/quotation?download=pdf", request.url));
    }
  } catch (error) {
    console.error("Error processing short URL:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

