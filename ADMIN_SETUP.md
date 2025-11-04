# Admin Setup Instructions

## Step 1: Create Admin Account

1. Go to the login page of your app
2. Click on "Sign Up" tab
3. Use these credentials:
   - **Email**: `admin@vitapedu.ac.in`
   - **Password**: `admin@123`
   - **Name**: `Admin`
   - **Registration Number**: Use any valid reg number (e.g., `23BCE8594`)

4. Complete the signup process

## Step 2: Assign Admin Role

After creating the account, you need to assign the admin role to this user. You can do this by running the following SQL query in your backend:

```sql
-- First, get the user ID for the admin email
-- Replace 'ADMIN_USER_ID' with the actual user ID from the profiles table

-- Assign admin role to the user
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@vitapedu.ac.in'),
  'admin'
) ON CONFLICT (user_id, role) DO NOTHING;
```

Alternatively, you can find the user ID and insert it manually:

```sql
-- Find the user ID
SELECT id FROM auth.users WHERE email = 'admin@vitapedu.ac.in';

-- Then insert the admin role (replace UUID with actual ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'admin');
```

## Step 3: Verify Admin Access

1. Log out and log back in with admin credentials
2. You should now have access to:
   - All hostel categories (no restrictions)
   - Admin reply section on all complaints
   - Status change dropdown for all complaints
   - All complaints from all categories

## Admin Features

- **View All Complaints**: Access any hostel category without restrictions
- **Change Status**: Update complaint status (Open → In Progress → Resolved)
- **Post Public Replies**: Respond to complaints with official admin replies
- **No Profile Required**: Admin doesn't need a student profile

## Security Note

The admin functionality is secured using Row Level Security (RLS) policies in the database. Only users with the 'admin' role in the `user_roles` table can:
- Update complaint statuses
- Post admin replies
- Access all categories

Regular students can only access their assigned hostel and common sections.
