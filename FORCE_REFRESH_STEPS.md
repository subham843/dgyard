# Home Page Force Refresh - Complete Steps

## Problem
Home page purana version dikh raha hai despite updates.

## Complete Solution (Step by Step):

### Step 1: Stop Dev Server Completely
1. Terminal mein `Ctrl + C` press karein
2. Wait karein ki server completely stop ho jaye
3. Agar process still running hai, Task Manager se `node.exe` processes kill karein

### Step 2: Clear All Caches (PowerShell - Run as Administrator)
```powershell
# Navigate to project
cd "e:\dg yard\dgyardwebapp"

# Clear Next.js cache
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Next.js cache cleared"

# Clear node_modules cache
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Node modules cache cleared"

# Clear npm cache (optional but recommended)
npm cache clean --force
Write-Host "✓ NPM cache cleared"
```

### Step 3: Restart Dev Server
```powershell
npm run dev
```

### Step 4: Browser Cache Complete Clear

#### Chrome/Edge:
1. `Ctrl + Shift + Delete` press karein
2. Time range: "All time" select karein
3. Check these:
   - ✅ Cached images and files
   - ✅ Cookies and other site data
4. "Clear data" click karein
5. Browser completely close karein
6. Browser phir se open karein

#### OR Use Incognito/Private Window:
- `Ctrl + Shift + N` (Chrome) ya `Ctrl + Shift + P` (Firefox)
- Direct `http://localhost:3000` open karein

### Step 5: Hard Refresh
- `Ctrl + Shift + R` (Windows/Linux)
- Ya `Ctrl + F5`
- Ya Developer Tools open karein (`F12`) → Network tab → "Disable cache" check karein → Page refresh karein

### Step 6: Verify Latest Version

Home page par yeh check karein:

#### Hero Section:
- ✅ "Premium Security Solutions" heading
- ✅ "Trusted Since 2010" badge
- ✅ "AI-Powered Services" badge with Bot icon
- ✅ Three service cards: CCTV Solutions, Networking Services, Digital Marketing

#### All Sections Should Be Visible:
1. Hero Section
2. How We Work
3. Offers
4. Calculator (CCTV Price Calculator)
5. Products
6. Services (with 4 service cards)
7. Product Categories
8. Trusted Brands
9. Features (5 features with icons)
10. Testimonials
11. Meet Honey (AI Assistant section)
12. CTA Section

### Step 7: Check Header
- Header mein "Services" dropdown check karein
- Dropdown mein "📋 Book Service / Complaint" link hona chahiye

### Step 8: If Still Not Working

#### Option A: Different Port
```powershell
# Stop current server
# Then:
$env:PORT=3001; npm run dev
```
Phir `http://localhost:3001` open karein

#### Option B: Check Browser Console
1. `F12` press karein
2. Console tab check karein for errors
3. Network tab mein page request check karein
4. Response headers check karein - `Cache-Control` header dekh sakte hain

#### Option C: Check if Production Build is Running
```powershell
# Check if production server is running
Get-Process -Name node -ErrorAction SilentlyContinue

# If production build exists, delete it
Remove-Item -Path .next -Recurse -Force
```

### Step 9: Verify Components Are Latest

Check these files have latest content:
- `app/page.tsx` - Should have all 12 sections
- `components/sections/hero.tsx` - Should have "Premium Security Solutions"
- `components/sections/services.tsx` - Should have 4 services

### Step 10: Nuclear Option (Last Resort)
```powershell
# Complete clean
Remove-Item -Path .next -Recurse -Force
Remove-Item -Path node_modules\.cache -Recurse -Force
npm cache clean --force
npm run dev
```

## Expected Latest Home Page Features:
- ✅ Modern Hero with "Premium Security Solutions"
- ✅ AI-Powered Services badge
- ✅ All 12 sections in correct order
- ✅ Services dropdown with "Book Service / Complaint" link
- ✅ Unified booking system accessible

## Debugging:
Agar abhi bhi purana version dikh raha hai:
1. Browser Developer Tools → Network tab → Check actual HTML response
2. View Page Source (`Ctrl + U`) → Check if latest content hai
3. Check terminal logs for any build errors
4. Try different browser completely
