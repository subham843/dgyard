/**
 * Google My Business API OAuth and Token Management
 */

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function getGMBTokens(code: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/admin/gmb/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshGMBToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

export async function getValidAccessToken(
  accessToken: string | null,
  refreshToken: string | null,
  tokenExpiry: Date | null,
  updateCallback?: (token: string, expiry: Date) => Promise<void>
): Promise<string | null> {
  if (!accessToken || !refreshToken) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  if (tokenExpiry && new Date() > new Date(tokenExpiry.getTime() - 5 * 60 * 1000)) {
    // Token expired, refresh it
    try {
      const newTokens = await refreshGMBToken(refreshToken);
      const newExpiry = new Date();
      newExpiry.setSeconds(newExpiry.getSeconds() + (newTokens.expires_in || 3600));
      
      // Update in database if callback provided
      if (updateCallback) {
        await updateCallback(newTokens.access_token, newExpiry);
      }
      
      return newTokens.access_token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return null;
    }
  }

  return accessToken;
}

export function getGMBAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/admin/gmb/callback`;

  if (!clientId) {
    throw new Error("Google OAuth credentials not configured");
  }

  // Important: Google has changed their API structure
  // The scope must match exactly with what's in Google Cloud Console
  // Check: https://developers.google.com/identity/protocols/oauth2/scopes
  // 
  // Try these scopes (only one should be needed, but listing alternatives):
  // Option 1: Legacy Google My Business scope (if still supported)
  // Option 2: Business Profile API scope (newer)
  // Option 3: Use the exact scope from Google Cloud Console OAuth consent screen
  
  const scopes = [
    "https://www.googleapis.com/auth/plus.business.manage", // Legacy GMB scope
  ].join(" ");
  
  // Note: If you get "invalid_scope" error, manually check the correct scope at:
  // https://developers.google.com/identity/protocols/oauth2/scopes
  // Search for "Business Profile" or "My Business" to find the exact scope name

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent", // Force consent to get refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

