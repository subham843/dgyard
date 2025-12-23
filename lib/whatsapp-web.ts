// This file is server-only - WhatsApp Web.js uses Puppeteer which only works on Node.js
// DO NOT import this file in client components
import { EventEmitter } from "events";

class WhatsAppWebService extends EventEmitter {
  private client: any = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  constructor() {
    super();
  }

  async initialize() {
    // Check if client exists and is ready
    if (this.client && this.isConnected) {
      console.log("[WhatsApp] Client already initialized and connected");
      // Verify connection is still valid
      try {
        const info = await this.client.info;
        if (info) {
          return; // Connection is valid
        }
      } catch (error) {
        console.log("[WhatsApp] Connection lost, reinitializing...");
        this.client = null;
        this.isConnected = false;
      }
    }

    // If client exists but not connected, check if it's still valid
    if (this.client) {
      try {
        // Check if client is still valid by getting its info
        const info = await this.client.info;
        if (info) {
          console.log("[WhatsApp] Client exists and is valid, marking as connected");
          this.isConnected = true;
          this.isConnecting = false;
          return;
        }
      } catch (error) {
        // Client exists but is invalid, recreate it
        console.log("[WhatsApp] Client exists but is invalid, recreating...");
        try {
          await this.client.destroy();
        } catch (destroyError) {
          // Ignore destroy errors
        }
        this.client = null;
        this.isConnected = false;
      }
    }

    if (this.isConnecting) {
      console.log("[WhatsApp] Connection already in progress...");
      return;
    }

    this.isConnecting = true;

    try {
      // Dynamic import to avoid bundling issues - only load on server
      const whatsappWeb = await import('whatsapp-web.js');
      const { Client: WhatsAppClient, LocalAuth: WhatsAppLocalAuth } = whatsappWeb;

      this.client = new WhatsAppClient({
        authStrategy: new WhatsAppLocalAuth({
          dataPath: "./.wwebjs_auth",
        }),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
          ],
        },
      });

      // QR Code event
      this.client.on("qr", async (qr) => {
        try {
          // Dynamic import to avoid bundling issues
          const qrcodeModule = await import('qrcode');
          this.qrCode = await qrcodeModule.default.toDataURL(qr);
          this.emit("qr", this.qrCode);
          console.log("QR Code generated");
        } catch (error) {
          console.error("Error generating QR code:", error);
        }
      });

      // Ready event
      this.client.on("ready", () => {
        console.log("WhatsApp Web client is ready!");
        this.isConnected = true;
        this.isConnecting = false;
        this.qrCode = null;
        this.emit("ready");
        console.log("WhatsApp connection established and persisted");
      });

      // Authentication event
      this.client.on("authenticated", () => {
        console.log("WhatsApp Web authenticated");
        this.emit("authenticated");
      });

      // Authentication failure
      this.client.on("auth_failure", (msg) => {
        console.error("WhatsApp Web authentication failure:", msg);
        this.isConnected = false;
        this.isConnecting = false;
        this.emit("auth_failure", msg);
      });

      // Disconnected
      this.client.on("disconnected", (reason) => {
        console.log("WhatsApp Web disconnected:", reason);
        this.isConnected = false;
        this.emit("disconnected", reason);
        // Try to reconnect
        if (reason === "NAVIGATION") {
          this.initialize();
        }
      });

      // Initialize the client
      await this.client.initialize();
    } catch (error) {
      console.error("Error initializing WhatsApp Web client:", error);
      this.isConnecting = false;
      this.emit("error", error);
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    // Re-check connection status before sending
    if (!this.client) {
      throw new Error("WhatsApp Web client not initialized. Please connect first.");
    }

    // Check if client is still connected
    if (!this.isConnected) {
      // Try to check if client is actually ready
      try {
        const info = await this.client.info;
        if (info) {
          this.isConnected = true;
        } else {
          throw new Error("WhatsApp Web is not connected. Please connect first.");
        }
      } catch (error) {
        throw new Error("WhatsApp Web is not connected. Please connect first.");
      }
    }

    try {
      // Format phone number (remove + and ensure it's in international format)
      let formattedNumber = phoneNumber.replace(/[\s\-()]/g, "");
      
      if (!formattedNumber.startsWith("+")) {
        // Remove leading 0 if present
        formattedNumber = formattedNumber.replace(/^0+/, "");
        // Add country code for India (91) if not already present
        if (!formattedNumber.startsWith("91") && formattedNumber.length === 10) {
          formattedNumber = "91" + formattedNumber;
        }
        formattedNumber = formattedNumber + "@c.us";
      } else {
        formattedNumber = formattedNumber.substring(1) + "@c.us";
      }

      const result = await this.client.sendMessage(formattedNumber, message);
      return { success: true, messageId: result.id._serialized };
    } catch (error: any) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    hasQRCode: boolean;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      hasQRCode: this.qrCode !== null,
    };
  }

  // Get client instance for status verification (internal use)
  getClient() {
    return this.client;
  }

  // Verify connection by checking client info
  async verifyConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const info = await this.client.info;
      if (info) {
        this.isConnected = true;
        return true;
      }
      return false;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
    }
  }

  async reconnect() {
    await this.disconnect();
    await this.initialize();
  }
}

// Global singleton instance - persists across serverless function invocations
// Use globalThis to ensure persistence in Next.js serverless environment
declare global {
  // eslint-disable-next-line no-var
  var whatsappService: WhatsAppWebService | undefined;
}

// Singleton instance with global persistence for Next.js serverless
export function getWhatsAppService(): WhatsAppWebService {
  // In development, use global to persist across hot reloads
  // In production, this will persist across serverless function invocations
  if (!global.whatsappService) {
    global.whatsappService = new WhatsAppWebService();
  }
  return global.whatsappService;
}











