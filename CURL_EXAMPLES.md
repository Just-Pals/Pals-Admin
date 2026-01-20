# API Authentication Examples

## `/api/user/all` Endpoint

This endpoint requires:
1. **JWT Bearer Token** in the Authorization header
2. **Admin Role** - The authenticated user must have `role: 'admin'`

### Correct cURL Command

```bash
curl "https://pals-back.onrender.com/api/user/all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### How to Get a Token

1. **Login as an admin user:**
```bash
curl "https://pals-back.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"yourpassword\"}"
```

2. **Extract the token from the response:**
   The response will look like:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": { ... }
     }
   }
   ```

3. **Use the token in subsequent requests:**
```bash
curl "https://pals-back.onrender.com/api/user/all" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Using the Admin Panel

The admin panel automatically:
1. Stores tokens in localStorage when you login
2. Adds the Authorization header to all API requests
3. Handles authentication automatically

To test:
1. Go to `/auth` page
2. Use the Login form to get a token
3. Then use "Get All Users" - it will automatically include the token

### Error Responses

**401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**403 Forbidden** - User doesn't have admin role:
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

### Creating an Admin User

To create an admin user, you need to:
1. Register a user normally
2. Manually update the user's role in the database to 'admin'

Or use MongoDB directly:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```


