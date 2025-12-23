import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App | null = null;
let adminAuth: Auth | null = null;

function initializeFirebaseAdmin() {
  if (app) {
    return { app, adminAuth };
  }

  // Check if required environment variables are present
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin SDK not initialized: Missing required environment variables. " +
      "Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY"
    );
    return { app: null, adminAuth: null };
  }

  try {
    if (!getApps().length) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      app = getApps()[0];
    }

    adminAuth = getAuth(app);
    return { app, adminAuth };
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    return { app: null, adminAuth: null };
  }
}

// Initialize on module load
const initialized = initializeFirebaseAdmin();
app = initialized.app;
adminAuth = initialized.adminAuth;

export { app, adminAuth };






















