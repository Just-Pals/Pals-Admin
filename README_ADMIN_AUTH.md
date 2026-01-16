# Admin Authentication Setup

## Overview

The admin panel now has its own authentication system that is separate from the regular app authentication. Admin login does NOT use OTP and works only for users with `role: 'admin'`.

## Creating Admin User

### Option 1: Using the Script (Recommended)

Run the script to create the default admin user:

```bash
cd Pals-Backend
npm run create-admin
```

This will create an admin user with:
- **Username**: `admin`
- **Email**: `admin@pals.com`
- **Password**: `Admin@123`
- **Role**: `admin`

### Option 2: Manual Creation

You can also create an admin user manually in MongoDB:

```javascript
// In MongoDB shell or MongoDB Compass
db.users.insertOne({
  name: "admin",
  email: "admin@pals.com",
  password: "$2a$10$...", // bcrypt hash of "Admin@123"
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
  "email": "admin@pals.com",
  // OR
  "username": "admin",
  "password": "Admin@123"
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
      "email": "admin@pals.com",
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
- Change the default password after first login
- Use strong passwords in production
- Admin credentials should never be used in the mobile app
- The admin login endpoint is separate from regular user login

## Using the Admin Panel

1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login` if not authenticated
3. Enter admin credentials:
   - Username: `admin` (or email: `admin@pals.com`)
   - Password: `Admin@123`
4. After login, you'll be redirected to the dashboard
5. Click "Logout" in the navbar to sign out

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

