# Quick Start Guide

## Prerequisites
1. Backend server is live on Render: `https://pals-back.onrender.com`
2. Node.js 18+ installed

## Setup Steps

1. **Navigate to the admin panel directory:**
   ```bash
   cd Pals-Admin
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Environment file (optional):**
   The admin panel is already configured to use the live backend (`https://pals-back.onrender.com/api`).
   
   If you need to override this, create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=https://pals-back.onrender.com/api
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Check Dashboard**: Go to `/dashboard` to see overview statistics
2. **View Users**: Go to `/users` to see all registered users
3. **Test APIs**: Go to `/auth` to test all backend APIs interactively
4. **Check KYC**: Go to `/kyc` to view KYC submissions

## API Testing

The `/auth` page provides an interactive interface to test all APIs:
- **Auth Tab**: Test signup, login, OTP, password reset
- **User Tab**: Test profile management, password change, get all users
- **KYC Tab**: Test KYC submission and status check
- **Health Tab**: Test health check and wake endpoints

## Troubleshooting

### Backend Connection Issues
- Ensure backend is accessible: Check `https://pals-back.onrender.com/api/health`
- Verify CORS is enabled on backend (should be configured for Render)
- Check browser console for CORS or network errors

### Port Already in Use
- Change Next.js port: `npm run dev -- -p 3001`
- Or stop the process using port 3000

### API Errors
- Check browser console (F12) for detailed errors
- Verify backend server logs
- Ensure backend routes match the API calls

## Next Steps

- Add authentication to admin panel (currently disabled as requested)
- Add user editing capabilities
- Add KYC approval/rejection functionality
- Add more detailed analytics

