# Admin Authentication Setup

## Overview

The admin panel now has its own authentication system that is separate from the regular app authentication. Admin login does NOT use OTP and works only for users with `role: 'admin'`.

## Creating Admin User

### Option 1: Using the Admin Register Form (Recommended)

1. Navigate to the admin panel login page
2. Click on "Register as Admin" link
3. Fill in your email and password (minimum 6 characters)
4. Submit the form to create your admin account
5. You'll be automatically logged in and redirected to the dashboard

### Option 2: Using the Admin Register API

You can register an admin using the API endpoint:

```bash
POST /api/admin/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

### Option 3: Manual Creation in MongoDB

You can also create an admin user manually in MongoDB:

```javascript
// In MongoDB shell or MongoDB Compass
db.users.insertOne({
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hash of your password
  role: "admin",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or update an existing user to admin:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { 
    $set: { 
      role: "admin",
      isVerified: true
    } 
  }
)
```

## Admin Login

### Endpoint
- **POST** `/api/admin/login`

### Request Body
```json
{
  "email": "admin@example.com",
  // OR
  "username": "admin",
  "password": "yourpassword"
}
```

### Response
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

## Features

1. **No OTP Required**: Admin login bypasses OTP verification
2. **Admin Only**: Only users with `role: 'admin'` can login through this endpoint
3. **Separate Token**: Admin tokens are stored separately from regular user tokens
4. **Protected Routes**: All admin panel routes require authentication

## Security Notes

⚠️ **IMPORTANT**: 
- Use strong passwords in production (minimum 6 characters, but longer is recommended)
- Admin credentials should never be used in the mobile app
- The admin login endpoint is separate from regular user login
- Keep your admin credentials secure and don't share them

## Using the Admin Panel

1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login` if not authenticated
3. If you don't have an account, click "Register as Admin" to create one
4. Enter your admin credentials (email/username and password)
5. After login, you'll be redirected to the dashboard
6. Click "Logout" in the navbar to sign out

## Troubleshooting

### "Access denied. Admin privileges required."
- The user you're trying to login with doesn't have `role: 'admin'`
- Solution: Update the user's role in the database or create a new admin user

### "Invalid credentials"
- Wrong username/email or password
- Solution: Verify credentials or reset password in database

### Token not working
- Make sure you're using the admin login endpoint (`/api/admin/login`)
- Regular user tokens won't work for admin routes that require admin role


