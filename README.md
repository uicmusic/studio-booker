# Studio Booker - UIC Music Department

A simple studio booking system for UIC Music Department students at BSD campus.

## 🎯 Features

- ✅ **Student Dashboard** - View available studios & booking status
- ✅ **Studio Booking** - Browse and book studios with time slots
- ✅ **Equipment/Inventory** - Borrow equipment alongside studio booking
- ✅ **Approval System** - Lecturers can approve/reject bookings
- ✅ **Return Proof** - Upload photos as evidence of equipment return
- ✅ **Admin Dashboard** - Monitor all bookings and inventory (for Feliks)
- ✅ **Role-Based Access** - Student, Lecturer, and Admin roles

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup database** (SQLite for development):
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👤 Demo Accounts

For testing purposes, you can login with these accounts (just enter email and select role):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@uic.edu | (any) |
| Lecturer (Feliks) | feliks@uic.edu | (any) |
| Student | student@uic.edu | (any) |

**Note:** No password required for demo - just enter email and select role!

## 📖 User Guide

### For Students

1. **Login** with your UIC email
2. **Browse Studios** - See available studios on the dashboard
3. **Create Booking**:
   - Select studio
   - Choose date and time
   - Add purpose
   - Select equipment (optional)
4. **Wait for Approval** - Feliks will review your booking
5. **Use Studio & Equipment** - Once approved
6. **Upload Return Proof** - Take photos of returned equipment
7. **View History** - Check your booking history anytime

### For Lecturers (Feliks)

1. **Login** with lecturer account
2. **View Pending Approvals** - See all pending bookings on admin dashboard
3. **Approve/Reject** - Review and approve or reject bookings
4. **Monitor Everything** - View all bookings, studios, and equipment status
5. **Track Returns** - Check return proofs uploaded by students

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form
- **Icons**: Lucide React

## 📁 Project Structure

```
studio-booker/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── studios/      # Studio endpoints
│   │   ├── equipment/    # Equipment endpoints
│   │   └── bookings/     # Booking endpoints
│   ├── auth/             # Auth pages
│   ├── dashboard/        # Student dashboard
│   ├── bookings/         # Booking pages
│   ├── studios/          # Studio listing
│   ├── admin/            # Admin dashboard
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── Navbar.tsx
│   └── SessionProvider.tsx
├── lib/                  # Utilities
│   ├── prisma.ts
│   ├── auth.ts
│   ├── next-auth.ts
│   └── types.ts
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Demo data seeder
│   └── dev.db            # SQLite database
└── public/
    └── uploads/          # File uploads directory
```

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with demo data
npm run db:studio        # Open Prisma Studio (database GUI)

# Linting
npm run lint             # Run ESLint
```

## 📊 Database Schema

- **User** - Students, Lecturers, and Admins
- **Studio** - Available studios for booking
- **Equipment** - Inventory items that can be borrowed
- **Booking** - Studio bookings with date/time
- **BookingEquipment** - Equipment associated with bookings
- **ReturnProof** - Photo evidence of equipment return

## 🔄 User Flow

```
Student Flow:
1. Login → 2. Browse Studios → 3. Create Booking → 4. Wait Approval → 
5. Use Studio → 6. Upload Return Proof → 7. Done ✓

Lecturer Flow:
1. Login → 2. View Pending → 3. Approve/Reject → 4. Monitor All → 5. Track Returns ✓
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Set environment variables:
   - `DATABASE_URL` (use Supabase/Neon for PostgreSQL)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production URL)
5. Deploy!

### Database Options for Production

- **Supabase** (Recommended): https://supabase.com - Free PostgreSQL hosting
- **Neon**: https://neon.tech - Serverless PostgreSQL
- **Railway**: https://railway.app - Easy deployment

## 📝 Next Steps

When you get the Google Sheets and inventory list from Feliks:

1. **Import Existing Data**:
   - Update `prisma/seed.ts` with real studio and equipment data
   - Run `npm run db:seed` to populate

2. **Customize Booking Rules**:
   - Edit time slot validation in `/api/bookings/route.ts`
   - Add capacity limits, blackout dates, etc.

3. **Add More Features**:
   - Email notifications
   - Calendar view
   - Export reports
   - Advanced analytics

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Authentication Issues
- Make sure you're using the correct email format
- For demo, no password is needed
- Check browser console for errors

## 📞 Support

For questions or issues, contact:
- Alexander Kosasih (Project Lead)
- UIC Music Department, BSD Campus

## 📄 License

This project is for educational purposes at UIC Music Department.

---

**Built with ❤️ for UIC Music Department Students**
