# Database Connection Troubleshooting

## Error: PrismaClientInitializationError (P1001)

**Error Message:** `Can't reach database server at ep-old-mouse-a15mu2dq-pooler.ap-southeast-1.aws.neon.tech:5432`

This error means Prisma cannot connect to your Neon database. Here are the steps to fix it:

---

## 🔍 Step 1: Check Your DATABASE_URL

### For Neon Database

Your `DATABASE_URL` in `backend/.env` should look like this:

```env
DATABASE_URL="postgresql://username:password@ep-old-mouse-a15mu2dq-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require"
```

**Important points:**
- ✅ Must include `?sslmode=require` at the end (required for Neon)
- ✅ Use the **pooler** endpoint (ends with `-pooler`) for better connection handling
- ✅ Or use the **direct** endpoint (without `-pooler`) if pooler doesn't work

### Get Your Connection String from Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection string** (not the pooler one, or try both)
5. Make sure it includes `?sslmode=require`

---

## 🔍 Step 2: Check if Database is Paused

**Neon databases pause after inactivity** to save resources. If your database is paused:

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. If you see a "Resume" button, click it to wake up the database
4. Wait a few seconds for it to start
5. Try connecting again

---

## 🔍 Step 3: Verify Database is Running

### Test Connection Manually

You can test the connection using `psql` or a database client:

```bash
# Using psql (if installed)
psql "postgresql://username:password@ep-old-mouse-a15mu2dq-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require"

# Or test with Prisma
cd backend
npx prisma db pull
```

If this fails, the issue is with the database itself, not your code.

---

## 🔍 Step 4: Check Network/Firewall

- Ensure your internet connection is working
- Check if you're behind a corporate firewall that blocks database connections
- Try using a VPN if needed

---

## 🔍 Step 5: Try Direct Connection (Non-Pooler)

If the pooler endpoint doesn't work, try the direct connection:

1. In Neon Console, get the **direct connection string** (without `-pooler`)
2. Update your `DATABASE_URL` in `.env`
3. Restart your application

**Example:**
```env
DATABASE_URL="postgresql://username:password@ep-old-mouse-a15mu2dq.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require"
```

---

## 🔍 Step 6: Verify Environment Variables

Make sure your `.env` file is in the correct location:

- ✅ File should be at: `backend/.env`
- ✅ Not at: `backend/src/.env` or root `.env`
- ✅ Check for typos in variable name: `DATABASE_URL` (not `DATABASE_URI`)

### Quick Check

```bash
cd backend
# Print DATABASE_URL (without showing password)
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))"
```

---

## 🔍 Step 7: Regenerate Prisma Client

Sometimes Prisma client needs to be regenerated:

```bash
cd backend
npx prisma generate
```

---

## 🔍 Step 8: Check Prisma Schema

Verify your `backend/prisma/schema.prisma` has the correct datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🚀 Quick Fix Checklist

- [ ] Database is not paused in Neon Console
- [ ] `DATABASE_URL` includes `?sslmode=require`
- [ ] `.env` file is in `backend/` directory
- [ ] Connection string is correct (no typos)
- [ ] Internet connection is working
- [ ] Tried both pooler and direct connection strings
- [ ] Regenerated Prisma client: `npx prisma generate`

---

## 💡 Development Tip

For development, you can use a local PostgreSQL database instead:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pet_platform?schema=public"
```

Then run migrations:
```bash
cd backend
npx prisma migrate dev --name init
```

---

## 🆘 Still Having Issues?

1. **Check Neon Status**: Visit [Neon Status Page](https://status.neon.tech)
2. **Check Neon Logs**: In Neon Console, check connection logs
3. **Try Creating New Database**: Create a fresh Neon database and update `DATABASE_URL`
4. **Contact Support**: Reach out to Neon support if the issue persists

---

## 📝 Common Error Codes

- **P1001**: Can't reach database server (network/firewall issue)
- **P1000**: Authentication failed (wrong username/password)
- **P1003**: Database does not exist
- **P1017**: Server closed the connection (database paused or timeout)

---

**Last Updated**: Check your Neon dashboard for the most current connection details.

