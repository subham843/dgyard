# Home Page Cache Clear Instructions

## Steps to Fix Home Page Not Showing Latest Version:

### 1. Stop the Dev Server
Press `Ctrl + C` in the terminal where dev server is running

### 2. Clear All Caches
Run these commands in PowerShell:

```powershell
# Clear Next.js cache
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue

# Clear node_modules/.cache if exists
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue

# Clear browser cache (do this in browser)
# Chrome/Edge: Ctrl + Shift + Delete
# Firefox: Ctrl + Shift + Delete
```

### 3. Restart Dev Server
```powershell
npm run dev
```

### 4. Hard Refresh Browser
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Safari**: `Cmd + Shift + R`

### 5. If Still Not Working
Try opening in incognito/private mode to bypass browser cache completely.

## Current Home Page Structure:
- Hero Section
- How We Work
- Offers
- Calculator
- Products
- Services
- Product Categories
- Trusted Brands
- Features
- Testimonials
- Meet Honey (AI Assistant)
- CTA

All components are properly imported and should be visible.
