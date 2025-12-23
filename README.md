# D.G.Yard Web Application

A modern, scalable, and SEO-optimized web application for CCTV solutions, security systems, and professional services with complete dealer-technician job management system.

## 🚀 Features

### Core Features
- **E-commerce Platform**: Complete product catalog with shopping cart and checkout
- **Dynamic Price Calculator**: Interactive CCTV system price calculator
- **Service Booking**: Installation, networking, and digital marketing services
- **Admin Panel**: Role-based access control (RBAC) for managing products, orders, and users
- **Payment Integration**: Razorpay integration with webhook support
- **Authentication**: NextAuth.js with Google, Facebook, and Firebase OTP
- **Background Jobs**: BullMQ for processing async tasks
- **SEO Optimized**: Core Web Vitals A+, Schema Markup, SSR optimized
- **Modern UI/UX**: Beautiful, responsive design with smooth animations

### Advanced Features
- **Job Bidding System**: Complete technician-dealer job matching with bidding, negotiation, and FCFS system
- **Payment & Wallet System**: Ledger-based internal wallet with warranty holds and escrow
- **Rating & Trust Score**: Automated trust score calculation based on job performance, ratings, and behavior
- **Technician Panel**: Complete dashboard with 21 modules for job management, earnings, KYC, and more
- **Dealer Panel**: Complete dashboard with 21 modules for job posting, payments, inventory, and analytics
- **Commission System**: Automated commission calculation for services and products
- **AI Assistant (Honey)**: Multi-language AI assistant with voice support and self-learning capabilities

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
- **PDF Generation**: jsPDF with custom font support
- **Charts**: Recharts

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
│   │   ├── admin/         # Admin APIs
│   │   ├── dealer/        # Dealer APIs
│   │   ├── technician/    # Technician APIs
│   │   └── jobs/          # Job management APIs
│   ├── admin/             # Admin panel pages
│   ├── dealer/            # Dealer panel pages
│   ├── technician/        # Technician panel pages
│   └── (auth)/            # Authentication pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── admin/            # Admin components
│   ├── dealer/           # Dealer components
│   ├── technician/       # Technician components
│   └── sections/         # Page sections
├── lib/                  # Utility functions and configs
│   ├── services/         # Business logic services
│   └── fonts/            # Custom fonts for PDF
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

### Required
- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_URL` - Application URL (default: http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for NextAuth

### Optional (Authentication)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET` - Facebook OAuth

### Optional (Payments)
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Razorpay credentials

### Optional (AI Assistant)
- `OPENAI_API_KEY` - OpenAI API key (Priority 1)
- `GOOGLE_GENAI_API_KEY` - Google Gemini API key (Priority 2, fallback if OpenAI fails)
- Falls back to rule-based system if both AI providers are unavailable

### Optional (Email)
- `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (e.g., 587)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password (use App Password for Gmail)

### Optional (WhatsApp)
- `WHATSAPP_API_KEY` - WhatsApp API key
- `WHATSAPP_API_URL` - WhatsApp API URL

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

## 📊 Job Bidding System

### Overview
Complete job bidding and matching system with FCFS (First-Come-First-Serve), soft locks, negotiation, and payment escrow.

### Job States
- `PENDING` - Job created/broadcasted, visible to technicians
- `SOFT_LOCKED` - First technician accepted, waiting for dealer (45 seconds)
- `NEGOTIATION_PENDING` - Bid placed, waiting for dealer response
- `WAITING_FOR_PAYMENT` - Technician accepted, waiting for dealer payment (30 minutes deadline)
- `ASSIGNED` - Payment locked, job assigned to technician
- `IN_PROGRESS` - Work started
- `COMPLETION_PENDING_APPROVAL` - Work completed, waiting for approval
- `COMPLETED` - Approved, payment split done (80% immediate, 20% warranty hold)
- `CANCELLED` - Cancelled (with reason and penalty)

### Key Features
- **Soft Lock**: 45-second lock when technician accepts, auto-releases if dealer doesn't confirm
- **Payment Deadline**: 30-minute deadline for dealer to pay after technician acceptance
- **Negotiation**: Max 2 rounds of bidding with 5-minute timeout per bid
- **Job Re-circulation**: Jobs return to pool on reject/timeout/failure with cooldown period
- **State Validation**: Backend-enforced state transitions prevent invalid operations

### Background Tasks
Set up cron job to call `POST /api/jobs/background-tasks` every minute for:
- Soft lock expiry handling
- Payment deadline expiry handling
- Negotiation timeout handling
- Warranty hold auto-release

## 💰 Payment & Wallet System

### Architecture
Ledger-based internal wallet system ensuring:
- No cash trust between dealer & technician
- Platform controls warranty hold - all money tracked via ledger
- Every rupee is job-linked - no free wallet balance
- India-compliant - no RBI PPI licence dependency

### Payment Flow
1. Dealer creates job with amount, warranty days, hold percentage
2. Technician accepts job → Payment structure locked
3. Technician completes work → Status: `COMPLETION_PENDING_APPROVAL`
4. Dealer/Customer approves → Payment split executed:
   - **80%** credited immediately to technician (after commission)
   - **20%** held for warranty
   - Warranty timer starts
5. Warranty expires → 20% automatically released

### Warranty Hold System
- **LOCKED**: Normal hold status
- **RELEASED**: Hold released to technician
- **FROZEN**: Hold frozen due to complaint
- **FORFEITED**: Hold forfeited to dealer/refunded

### Commission System
- Automatic commission calculation based on configured rules
- Priority: Dealer-specific → City → Region → Job type → Default
- Transparent for dealers (see breakdown before payment)
- Hidden from technicians (only net earnings visible)

### Withdrawal Rules
Withdrawal allowed ONLY when:
- ✅ Hold released
- ✅ Warranty complete
- ✅ Admin/auto approved
- Goes directly to bank (NOT to wallet)

## ⭐ Rating & Trust Score System

### Trust Score Calculation
Automatically calculated based on:
- **Rating factors**: Average rating, total ratings, recent low ratings
- **Job completion**: Total, completed, on-time, late, abandoned
- **OTP source**: Customer OTP (positive) vs Dealer-only (negative)
- **Complaints & disputes**: Resolution rate and frequency
- **Rework requests**: Number of rework requests
- **Photo proof uploads**: Jobs with photo evidence
- **Admin actions**: Forced closures and manual adjustments

### Auto Rules
- **5⭐ rating** → +3 points
- **1⭐ rating** → -5 points
- **Customer OTP closure** → positive impact
- **Dealer-only OTP closure** → -2 points
- **Customer complaint** → -4 points
- **Job abandoned** → -10 points
- **On-time completion** → +1 point
- **Photo proof uploaded** → +5 points bonus

### Trust Score Status
- 🟢 **GOOD** (80-100): Priority jobs
- 🟡 **NORMAL** (60-79): Normal jobs
- 🟠 **RISK** (40-59): Limited jobs
- 🔴 **CRITICAL** (<40): Auto block + admin review

### Admin Controls
- Manual increase/decrease (normal admin: max ±5, super admin: unlimited)
- Reset trust score (super admin only)
- Recalculate trust score (auto calculation)
- Full audit history with reasons

## 👨‍🔧 Technician Panel

### Complete Dashboard (21 Modules)
1. **Dashboard Home** - Stats, available jobs, my bids, my jobs
2. **Job Discovery** - Browse and bid on jobs with distance calculation
3. **My Jobs** - All assigned jobs with status tracking
4. **Completed Jobs** - Completed jobs history
5. **Warranty Jobs** - Active warranty jobs management
6. **Disputed Jobs** - View and respond to disputes
7. **Job Completion** - Complete work with photo proof and OTP verification
8. **Earnings Overview** - Total earnings breakdown
9. **Wallet & Ledger** - Transaction history and balance
10. **Withdraw/Payout** - Request withdrawals
11. **Profile Management** - Edit personal information
12. **Bank Details** - Manage bank account information
13. **KYC & Verification** - Upload KYC documents
14. **Trust Score & Performance** - View trust score and performance metrics
15. **Notifications & Preferences** - Manage notification settings
16. **Documents & Certifications** - Upload and manage certificates
17. **Security & Login** - Change password, PIN, logout all devices
18. **Support & Help** - Submit support tickets
19. **Legal & Consent** - Terms, privacy policy
20. **Account Control** - Deactivate or delete account
21. **Availability Toggle** - Online/Offline status

### Key Features
- **Bidding System**: View bids, accept/reject counter offers, send counter offers (max 2 rounds)
- **Live Location Tracking**: Real-time GPS tracking for navigation
- **Photo Proof**: Before/after photo uploads required for job completion
- **OTP Verification**: Customer OTP verification for job completion
- **Earnings Tracking**: Real-time earnings, warranty holds, and commission breakdown
- **KYC Integration**: Profile incomplete → no bidding, KYC incomplete → no payout

## 🏪 Dealer Panel

### Complete Dashboard (21 Modules)
1. **Dashboard Home** - Stats, recent jobs, payments, orders
2. **Service Job Management** - Create, manage, and track service jobs
3. **Product Management** - Manage product catalog
4. **Inventory Management** - Stock levels and tracking
5. **Order Management** - Process and track orders
6. **Shipping & Delivery** - Manage shipping and tracking
7. **Payments & Settlement** - Payment history and settlements
8. **Returns, Refunds & RMA** - Handle returns and refunds
9. **Customer Management** - Manage customer relationships
10. **Billing, Invoices & GST** - Generate invoices with PDF download
11. **Wallet & Ledger** - Transaction history and balance
12. **Profile & Business Settings** - Edit business information
13. **KYC & Verification** - Upload KYC documents
14. **Bank & Settlement Details** - Manage bank and settlement information
15. **Reports & Analytics** - Revenue charts and performance analytics
16. **Marketing & Promotions** - Manage promotions and discounts
17. **Notifications & Preferences** - Manage notification settings
18. **Support & Disputes** - Submit support tickets and handle disputes
19. **Security & Account Settings** - Change password, security settings
20. **Legal & Consent** - Terms, privacy policy
21. **Account Control** - Deactivate or delete account

### Key Features
- **Job Posting**: Create jobs with detailed requirements, pricing, and warranty settings
- **Bid Management**: Accept, reject, or counter technician bids
- **Payment Escrow**: Lock payments before job assignment
- **Invoice Generation**: Professional PDF invoices with GST breakdown
- **CSV Export**: Export orders, customers, inventory, payments
- **Real-time Updates**: Auto-refreshing dashboard and notifications
- **Analytics**: Revenue breakdown charts and performance metrics
- **Bulk Operations**: Bulk status updates and inventory management

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

### Google GenAI Setup (Optional)
1. Visit: https://aistudio.google.com/
2. Sign in with Google account
3. Click "Get API Key" → "Create API Key"
4. Enable "Generative Language API" in Google Cloud Console
5. Add to `.env`: `GOOGLE_GENAI_API_KEY=your-api-key-here`

### Models Used
- `gemini-2.5-flash` (primary)
- `gemini-2.5-pro` (fallback)
- `gemini-2.0-flash` (fallback)

## 📧 Email Setup (Gmail)

### Gmail SMTP Configuration
1. Enable **2-Step Verification** in Google Account settings
2. Generate **App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name: "D.G.Yard SMTP"
   - Generate and copy 16-character password
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```
   **Important**: Use App Password, NOT regular Gmail password

### Alternative Email Services
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.region.amazonaws.com:587`

## 📄 PDF Invoice Setup (Rupee Symbol)

### Font Conversion (One-time setup)
1. Run: `node scripts/setup-rupee-font.js`
2. Open: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
3. Select: `lib/fonts/NotoSans-Regular-for-conversion.ttf`
4. Copy the base64 string from converter
5. Paste in `lib/fonts/noto-sans-converted.js`:
   ```javascript
   export const fontBase64 = "PASTE_YOUR_BASE64_STRING_HERE";
   ```
6. Restart dev server

After conversion, ₹ symbol will automatically appear in all PDFs.

## 🚀 Deployment Guide

### Pre-Deployment Checklist

1. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Environment Variables**
   - Set all required environment variables in production
   - Use production database connection string
   - Configure production email service
   - Set production API keys

3. **File Storage**
   - **Development**: Local storage (`public/uploads`)
   - **Production**: Cloud storage recommended (AWS S3, Cloudinary, etc.)

4. **Build & Test**
   ```bash
   npm install
   npm run build
   npm start
   ```

### Background Tasks Setup
Configure cron job to call `POST /api/jobs/background-tasks` every minute:
```bash
*/1 * * * * curl -X POST https://your-domain.com/api/jobs/background-tasks -H "X-API-Key: your-api-key"
```

### Security Considerations
- ✅ Rate limiting on API routes
- ✅ Authentication required for all routes
- ✅ Authorization checks (role-based access)
- ✅ Input validation on all endpoints
- ✅ HTTPS required (for geolocation API)
- ✅ File upload validation (type, size)
- ✅ OTP expiration and rate limiting

## 🧪 Testing Checklist

### Pre-Testing Setup
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Create `public/uploads/jobs` directory
- [ ] Verify environment variables are set
- [ ] Start development server: `npm run dev`

### Core Features Testing
- [ ] Admin panel access and navigation
- [ ] Dealer panel access and job creation
- [ ] Technician panel access and job bidding
- [ ] Job bidding flow (accept, bid, negotiate)
- [ ] Payment escrow and release
- [ ] Warranty hold and release
- [ ] Job completion with photo proof
- [ ] OTP verification
- [ ] Trust score calculation
- [ ] Rating system
- [ ] Commission calculation
- [ ] Invoice PDF generation
- [ ] CSV export functionality

### Edge Cases
- [ ] Soft lock expiry handling
- [ ] Payment deadline expiry
- [ ] Bid negotiation timeout
- [ ] Job re-circulation
- [ ] Cancellation penalties
- [ ] State transition validation
- [ ] File upload validation
- [ ] Location tracking permissions

## 🐛 Troubleshooting

### Common Issues

**Issue: Photos not uploading**
- Check directory permissions
- Verify file size limits
- Check cloud storage credentials (if using)

**Issue: Location tracking not working**
- Ensure HTTPS is enabled
- Check browser permissions
- Verify geolocation API support

**Issue: Distance not showing**
- Verify technician has location set
- Check job has location coordinates
- Verify distance calculation in API

**Issue: Stats not loading**
- Check API responses
- Verify database connections
- Check authentication

**Issue: Email not sending**
- Verify SMTP credentials (use App Password for Gmail)
- Check 2-Step Verification is enabled
- Review server logs for specific errors

**Issue: ₹ symbol not showing in PDF**
- Complete font conversion setup
- Verify base64 string in `lib/fonts/noto-sans-converted.js`
- Restart dev server after font setup

**Issue: Cache not clearing**
- Clear Next.js cache: `rm -rf .next`
- Hard refresh browser: `Ctrl + Shift + R`
- Clear browser cache: `Ctrl + Shift + Delete`
- Try incognito/private mode

## 📝 Database Schema Updates

### Important Fields Required

**Dealer Model:**
- `kycDocuments Json?` - KYC document storage
- `bankDetails Json?` - Bank details storage

**Order Model (Optional for shipping):**
- `courier String?` - Courier name
- `trackingNumber String?` - Tracking number

**JobPost Model:**
- `softLockedAt DateTime?`
- `softLockExpiresAt DateTime?`
- `softLockedByTechnicianId String?`
- `paymentDeadlineAt DateTime?`
- `rejectedTechnicianIds String[]`
- `reCirculationCount Int`
- `cancellationReason String?`
- `cancellationPenalty Float?`

Run migrations:
```bash
npx prisma generate
npx prisma db push
```

## 📚 Key API Endpoints

### Job Management
- `GET /api/jobs` - List jobs with filters
- `POST /api/jobs` - Create job (dealer)
- `POST /api/technician/jobs/[id]/accept` - Accept job (technician)
- `POST /api/jobs/[id]/bids` - Submit bid
- `POST /api/jobs/[id]/bids/[bidId]/accept` - Accept bid (dealer)
- `POST /api/jobs/[id]/bids/[bidId]/reject` - Reject bid
- `POST /api/jobs/[id]/bids/[bidId]/accept-technician` - Accept counter offer (technician)
- `POST /api/jobs/[id]/start` - Start work
- `POST /api/jobs/[id]/complete` - Complete work
- `POST /api/jobs/[id]/approve` - Approve completion (triggers payment split)
- `POST /api/jobs/[id]/cancel` - Cancel job
- `POST /api/jobs/background-tasks` - Background tasks cron endpoint

### Payment & Wallet
- `GET /api/technician/wallet` - Get wallet balance and ledger
- `POST /api/technician/withdraw` - Request withdrawal
- `GET /api/technician/earnings` - Get earnings breakdown
- `POST /api/jobs/[id]/lock-payment` - Lock payment in escrow
- `GET /api/warranty-holds` - List warranty holds
- `POST /api/warranty-holds/[id]` - Freeze/unfreeze warranty hold

### Commission
- `GET/POST/PUT /api/admin/commission/service` - Service commission management
- `GET/POST/PUT /api/admin/commission/product` - Product commission management
- `GET/POST/PUT /api/admin/commission/margin-rule` - Minimum margin rules
- `GET /api/admin/finance/platform-revenue` - Platform revenue stats

### Ratings & Trust Score
- `GET /api/admin/ratings` - List all ratings with filters
- `PUT /api/admin/ratings/[id]` - Update rating
- `DELETE /api/admin/ratings/[id]` - Delete rating
- `GET /api/admin/trust-scores` - List all users with trust scores
- `POST /api/admin/trust-scores/[userId]/increase` - Increase score
- `POST /api/admin/trust-scores/[userId]/decrease` - Decrease score
- `POST /api/admin/trust-scores/[userId]/recalculate` - Recalculate score

## 🎨 Design System

The application uses a modern, light color scheme with:
- **Primary**: Blue (#3b82f6)
- **Secondary**: Indigo
- **Accent**: Purple
- **No dark mode** (as per requirements)

## 📝 Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write SEO-friendly code
- Optimize for Core Web Vitals
- Follow accessibility guidelines (WCAG 2.1)
- Add loading states for async operations
- Implement proper form validation
- Use toast notifications for user feedback

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For support, email info@dgyard.com or call +91 98765 43210

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready
