# D.G.Yard Web Application

A modern, scalable, and SEO-optimized web application for CCTV solutions, security systems, and professional services.

## 🚀 Features

- **E-commerce Platform**: Complete product catalog with shopping cart and checkout
- **Dynamic Price Calculator**: Interactive CCTV system price calculator
- **Service Booking**: Installation, networking, and digital marketing services
- **Admin Panel**: Role-based access control (RBAC) for managing products, orders, and users
- **Payment Integration**: Razorpay integration with webhook support
- **Authentication**: NextAuth.js with Google, Facebook, and Firebase OTP
- **Background Jobs**: BullMQ for processing async tasks
- **SEO Optimized**: Core Web Vitals A+, Schema Markup, SSR optimized
- **Modern UI/UX**: Beautiful, responsive design with smooth animations

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Razorpay
- **Background Jobs**: BullMQ + Redis
- **Animations**: Framer Motion
- **State Management**: Zustand + React Query

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dgyardwebapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in all the required environment variables in `.env`

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
dgyardwebapp/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── sections/         # Page sections
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configs
├── prisma/               # Database schema
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🔐 Environment Variables

Required environment variables:

- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_URL` - Application URL (default: http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth (optional)
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET` - Facebook OAuth (optional)
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Razorpay credentials (optional)
- `OPENAI_API_KEY` - OpenAI API key for enhanced AI responses (optional - Priority 1)
- `GOOGLE_GENAI_API_KEY` - Google Gemini API key for AI responses (optional - Priority 2, fallback if OpenAI fails)
- Falls back to rule-based system if both AI providers are unavailable

## 🤖 Honey AI Assistant

### Features
- **Multi-language Support**: English (en-IN) and Hindi (hi-IN)
- **Voice Input/Output**: Speech recognition and text-to-speech
- **Role-based Responses**: Different responses for users and admins
- **Self-Learning System**: Automatically improves over time
- **Knowledge Base**: Stores and learns from conversations
- **External AI Integration**: OpenAI and Google GenAI support

### Response Priority
1. **Knowledge Base** (Self-learned) - Fastest, free
2. **OpenAI** (External AI) - If available
3. **Google GenAI** (External AI) - If OpenAI fails
4. **Rule-based** (Fallback) - Always available

### Voice Settings
- **Rate**: 1.0 (normal speed)
- **Pitch**: 1.0 (normal pitch)
- **Volume**: 1.0 (full volume)
- **Voice**: Natural Indian female voice (Heera excluded)
- **Language**: Auto-detects English/Hindi

### Testing Voice
Visit: `http://localhost:3000/test-voice` to test available voices

## 🧠 AI Self-Learning System

### How It Works
- Automatically stores every conversation
- Learns from external AI responses (OpenAI/Google GenAI)
- Builds knowledge base over time
- Reduces external AI dependency gradually

### Database Setup
```bash
npm run db:generate
npm run db:push
```

### Learning Timeline
- **Week 1-2**: External AI 70-80%, Learning phase
- **Week 3-4**: External AI 50-60%, Knowledge base growing
- **Month 2**: External AI 30-40%, Strong knowledge base
- **Month 3+**: External AI 10-20%, Mostly self-sufficient

### Feedback API
```typescript
POST /api/ai/feedback
Body: {
  conversationId: string,
  rating: number, // 1-5 or -1 (thumbs down), 1 (thumbs up)
  correctedResponse?: string
}
```

## 🔷 Google GenAI Setup (Optional)

### Get API Key
1. Visit: https://aistudio.google.com/
2. Sign in with Google account
3. Click "Get API Key" → "Create API Key"
4. Copy the API key

### Enable API
1. Visit: https://console.cloud.google.com/
2. Go to APIs & Services > Library
3. Search "Generative Language API"
4. Click "Enable"

### Add to .env
```env
GOOGLE_GENAI_API_KEY=your-api-key-here
```

### Models Used
- `gemini-2.5-flash` (primary)
- `gemini-2.5-pro` (fallback)
- `gemini-2.0-flash` (fallback)
- Automatic fallback to available models

### Troubleshooting
- **Model not found**: System automatically tries available models
- **API not enabled**: Enable in Google Cloud Console
- **Rate limit**: Wait or upgrade to paid tier

## 🎤 Voice Testing

### Voice Source
Browser ki built-in Web Speech API (SpeechSynthesis). Voices browser aur OS par depend karti hain.

### Test Voices
1. Visit: `http://localhost:3000/test-voice`
2. Select voice from list
3. Enter test text
4. Adjust rate/pitch/volume
5. Click "Play Voice"

### Browser Console Test
```javascript
const voices = window.speechSynthesis.getVoices();
const utterance = new SpeechSynthesisUtterance("Namaste! Main Honey hoon.");
utterance.voice = voices.find(v => v.name.includes("Neerja"));
utterance.rate = 1.0;
utterance.pitch = 1.0;
window.speechSynthesis.speak(utterance);
```

### Online Testing Tools
- Google Text-to-Speech: https://cloud.google.com/text-to-speech
- Natural Readers: https://www.naturalreaders.com/online/
- Amazon Polly: https://aws.amazon.com/polly/

## 👤 Super Admin Setup

**Default Admin Credentials:**
- **Name:** Subham
- **Email:** subham@dgyard.com
- **Password:** Subham@1994

**Setup:**
1. Sign up at `/auth/signup` with above credentials
2. Call API: `POST /api/admin/create-super-admin` with body `{"secret": "create-admin-2024"}`
3. Or update user role to `"ADMIN"` in MongoDB
4. Login at `/auth/signin` and access admin panel at `/admin`

## 📝 Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write SEO-friendly code
- Optimize for Core Web Vitals
- Follow accessibility guidelines (WCAG 2.1)

## 🎨 Design System

The application uses a modern, light color scheme with:
- Primary: Blue (#3b82f6)
- Secondary: Indigo
- Accent: Purple
- No dark mode (as per requirements)

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For support, email info@dgyard.com or call +91 98765 43210



