# PALS Admin Panel

A Next.js admin panel for managing the PALS application backend. This admin panel provides a comprehensive interface to test and manage all backend APIs.

## Features

- 📊 **Dashboard**: Overview statistics of users, KYC submissions, and server status
- 👥 **Users Management**: View and manage all registered users
- 🔐 **KYC Management**: Review and manage KYC submissions with filtering
- 🧪 **API Testing**: Interactive interface to test all backend APIs
- 🎨 **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on Render (https://pals-back.onrender.com)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables (optional):**
   Create a `.env.local` file in the root directory if you want to override the default:
   ```env
   NEXT_PUBLIC_API_URL=https://pals-back.onrender.com/api
   ```
   
   **Note:** The admin panel is already configured to use the live backend by default.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Pages

### Dashboard (`/dashboard`)
- View total users count
- View verified users count
- View pending and completed KYC counts
- Check server status
- Refresh statistics

### Users (`/users`)
- List all registered users
- View user details (name, email, phone, role, verification status, KYC status)
- Filter and search users
- View user creation dates

### KYC (`/kyc`)
- View all KYC submissions
- Filter by status (all, pending, completed, rejected)
- View detailed KYC information including:
  - Profile photos
  - Government ID front and back images
  - Personal information
  - Submission dates

### Auth Testing (`/auth`)
Interactive API testing interface with tabs for:
- **Auth APIs**: Signup, Login, Send OTP, Verify OTP, Get Current User
- **User APIs**: Get Profile, Update Profile, Change Password, Get All Users
- **KYC APIs**: Submit KYC, Get KYC Status
- **Health APIs**: Health Check, Wake Up

## API Integration

The admin panel connects to the following backend endpoints:

### Authentication (`/api/auth`)
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### User Management (`/api/user`)
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `PUT /user/change-password` - Change password
- `GET /user/all` - Get all users (Admin only)

### KYC (`/api/kyc`)
- `POST /kyc/submit` - Submit KYC documents
- `GET /kyc/status` - Get KYC status

### Health Check (`/api`)
- `GET /health` - Server health check
- `GET /wake` - Wake up endpoint

## Project Structure

```
Pals-Admin/
├── app/
│   ├── dashboard/      # Dashboard page
│   ├── users/          # Users management page
│   ├── kyc/            # KYC management page
│   ├── auth/           # API testing page
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   └── Navbar.tsx      # Navigation component
├── lib/
│   └── api.ts          # API service layer
└── package.json
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Notes

- Authentication is currently disabled for the admin panel (as requested)
- The admin panel automatically stores JWT tokens in localStorage when received from API responses
- All API calls include the token in the Authorization header if available
- Make sure the backend server is running before using the admin panel

## Troubleshooting

### Connection Issues
- Ensure the backend server is running on the configured port
- Check the `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS is enabled on the backend

### API Errors
- Check browser console for detailed error messages
- Verify the backend server is accessible
- Ensure proper authentication tokens are stored (if required)

## License

ISC

