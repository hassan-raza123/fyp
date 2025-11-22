# EduTrack - OBE Management System

**Transforming Education Through Outcomes**

A comprehensive Outcome-Based Education (OBE) Management System built with Next.js 15, React 18, TypeScript, and Prisma ORM for MNS University of Engineering & Technology.

## 🚀 Live Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy automatically

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with NextAuth.js
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## 📋 Features

### Multi-Role Management

- **Admin**: Full system access
- **Department Admin**: Department-specific management
- **Faculty**: Course and assessment management
- **Student**: View results and progress

### Core Modules

- **User Management**: Role-based access control
- **Department & Program Management**: Academic structure
- **Course Management**: CLOs, assessments, offerings
- **Student Management**: Batches, sections, attendance
- **Assessment System**: Marks entry, analytics
- **Results Management**: CLO/PLO attainments
- **Analytics Dashboard**: Comprehensive reporting

## 🎨 Design System

### Color Theme

- **Primary**: Purple gradient (#7C3AED to #6366F1)
- **Secondary**: Indigo (#4F46E5)
- **Accent**: Emerald (#10B981)
- **Background**: Light gray (#F9FAFB)

### UI Components

- Modern, responsive design
- Dark/light mode support
- Accessible components
- Mobile-first approach

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed database
npm run seed:basic

# Start development server
npm run dev
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (authenticated-routes)/ # Protected routes
│   ├── api/               # API routes
│   └── (LandingPages)/    # Public pages
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
└── styles/               # Global styles
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/smart_campus"

# Authentication
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"

# Email (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 📊 Database Schema

The system uses a comprehensive database schema with:

- **Users & Roles**: Multi-role authentication
- **Academic Structure**: Departments, Programs, Courses
- **Student Management**: Batches, Sections, Students
- **Assessment System**: CLOs, PLOs, Assessments, Results
- **Analytics**: Comprehensive reporting and analytics

## 🎯 OBE Framework Implementation

- **CLOs (Course Learning Outcomes)**: Course-specific outcomes
- **PLOs (Program Learning Outcomes)**: Program-level outcomes
- **Assessment Mapping**: CLO-PLO mapping and evaluation
- **Attainment Tracking**: Real-time outcome attainment monitoring

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- CSRF protection
- Input validation and sanitization

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interfaces
- Progressive Web App features

## 🚀 Performance Optimizations

- Next.js 15 App Router
- Server-side rendering
- Image optimization
- Code splitting
- Bundle optimization

## 📈 Analytics & Reporting

- Real-time dashboards
- Interactive charts
- Export functionality
- Custom date ranges
- Multi-dimensional analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is developed for MNSUET as a Final Year Project.

## 👥 Team

- **Hassan Ali**: Full Stack Development
- **Mueez Ahmed**: Backend & Database
- **Supervisor**: Academic Guidance

---

**EduTrack** - Transforming Education Through Outcomes | MNS University of Engineering & Technology
