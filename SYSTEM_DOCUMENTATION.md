# OBE System - Complete Documentation

## System Overview (System Ka Overview)

Yeh ek **Outcome-Based Education (OBE) System** hai jo university ke har department ke liye alag-alag implement hoga. Har department apna khud ka admin panel use karega.

## Current System Architecture (Current System Ki Structure)

### 1. Role-Based Access Control (Role-Based Access)

System me **3 main roles** hain:

1. **Admin (Department Admin)**

   - Har department ka apna admin hota hai
   - Sirf apne department ki data manage kar sakta hai
   - Super admin ya sub-admin nahi hai - sirf department admin

2. **Teacher (Faculty)**

   - Apne department ke teachers
   - Apne courses, sections, assessments manage karte hain
   - Students ko marks dete hain

3. **Student**
   - Apne courses, results, attendance dekh sakte hain

### 2. Department Structure (Department Ki Structure)

```
Department
  ├── Admin (Department Admin)
  ├── Programs (BSCS, BSIT, etc.)
  │   ├── Batches (2021, 2022, 2023, etc.)
  │   │   ├── Sections
  │   │   │   ├── Session Type (Morning/Evening)
  │   │   │   ├── Faculty
  │   │   │   └── Students
  │   │   └── Students
  │   ├── PLOs (Program Learning Outcomes)
  │   └── Grade Scales
  ├── Courses
  │   ├── CLOs (Course Learning Outcomes) - Theory ke liye
  │   ├── LLOs (Lab Learning Outcomes) - Lab/Practical ke liye
  │   └── Course Offerings
  │       ├── Sections
  │       ├── Assessments
  │       └── Results
  └── Faculty Members
```

### 3. Key Features (Main Features)

#### A. Batches Management

- Har program ke liye batches (2021, 2022, 2023, etc.)
- Batch code unique hota hai
- Start date aur end date
- Max students limit

#### B. Sections Management

- Har course offering ke liye sections
- **Session Type**: Morning ya Evening
- Faculty assignment
- Student enrollment
- Max students per section

#### C. Learning Outcomes

**PLOs (Program Learning Outcomes)**

- Program level ke learning outcomes
- Har program ke liye unique

**CLOs (Course Learning Outcomes)**

- Theory courses ke liye
- Format: CLO1, CLO2, CLO3, etc.
- Course se linked

**LLOs (Lab Learning Outcomes)** ✨ **NEW**

- Lab/Practical courses ke liye
- Format: LLO1, LLO2, LLO3, etc.
- Course se linked
- PLOs se mapping possible

#### D. Course Types

- **THEORY**: Theory courses
- **LAB**: Lab/Practical courses
- **PROJECT**: Project courses
- **THESIS**: Thesis courses

#### E. Assessments

- Quiz
- Assignment
- Mid Exam
- Final Exam
- Lab Exam
- Lab Report
- Presentation
- Viva
- Sessional Exam
- Class Participation
- Case Study

## Changes Made (Jo Changes Kiye Gaye)

### ✅ Completed Changes

1. **Removed Super Admin & Sub Admin**

   - Ab sirf `admin` role hai (department admin)
   - Sab `super_admin` aur `sub_admin` references remove kar diye
   - Files updated:
     - All API routes
     - Role management components

2. **Added LLO (Lab Learning Outcomes)**

   - Database schema me LLO model add kiya
   - LLO-PLO mappings support
   - LLO attainments tracking
   - API endpoints created:
     - `/api/llos` - GET, POST, PUT
     - `/api/llos/[id]` - GET, PUT, DELETE
     - `/api/courses/[id]/llos` - GET, POST

3. **Added Session Type to Sections**
   - Sections me `sessionType` field add kiya
   - Values: `morning` ya `evening`
   - Default: `morning`

### 🔄 Pending Changes (Jo Abhi Baki Hai)

1. **Update Sections API**

   - Sections create/update me `sessionType` field add karna
   - Frontend forms me session type selector add karna

2. **Frontend Components for LLO**

   - LLO management pages (admin, faculty, student)
   - LLO-PLO mapping interface
   - LLO attainments display

3. **Update Section Forms**

   - Create section dialog me session type dropdown
   - Edit section me session type update

4. **Department Scoping**

   - Ensure all APIs filter by department
   - Admin sirf apne department ki data dekh sake

5. **Database Migration**
   - Prisma migration create karni hai
   - Database me changes apply karne hain

## Complete OBE Flow (Complete OBE Ka Flow)

### 1. Setup Phase (Setup Ka Phase)

```
Admin Login
  ↓
Department Setup (if not exists)
  ↓
Programs Create (BSCS, BSIT, etc.)
  ↓
Courses Create
  ├── Theory Courses → CLOs define
  └── Lab Courses → LLOs define
  ↓
PLOs Define (Program level)
  ↓
CLO-PLO Mappings
LLO-PLO Mappings
  ↓
Batches Create (2021, 2022, etc.)
  ↓
Semesters Create
  ↓
Course Offerings Create
  ↓
Sections Create
  ├── Batch select
  ├── Session Type (Morning/Evening)
  └── Faculty Assign
```

### 2. Academic Year Flow (Academic Year Ka Flow)

```
Semester Start
  ↓
Course Offerings Active
  ↓
Sections Created
  ├── Morning Sections
  └── Evening Sections
  ↓
Students Enrolled in Sections
  ↓
Faculty Create Assessments
  ├── Theory Assessments → CLOs linked
  └── Lab Assessments → LLOs linked
  ↓
Marks Entry
  ↓
CLO Attainments Calculate
LLO Attainments Calculate
  ↓
PLO Attainments Calculate
  ↓
Results Published
  ↓
Reports Generate
```

### 3. Assessment Flow (Assessment Ka Flow)

```
Faculty Create Assessment
  ├── Assessment Type (Quiz, Mid, Final, Lab Exam, etc.)
  ├── Total Marks
  ├── Weightage
  └── Assessment Items
      ├── Question Number
      ├── Marks
      └── CLO/LLO Link
  ↓
Students Submit/Appear
  ↓
Faculty Evaluate
  ↓
Marks Entered
  ↓
CLO/LLO Attainments Calculated
  ↓
Results Published
```

## Database Schema Changes (Database Schema Ki Changes)

### New Models Added

1. **llos** (Lab Learning Outcomes)

   - id, code, description, courseId
   - bloomLevel, status
   - Relations: course, ploMappings, llosAttainments

2. **lloplomappings** (LLO-PLO Mappings)

   - lloId, ploId, weight

3. **llosattainments** (LLO Attainments)
   - lloId, courseOfferingId
   - totalStudents, studentsAchieved
   - attainmentPercent, calculatedBy

### Modified Models

1. **sections**

   - Added: `sessionType` (morning/evening)

2. **courses**

   - Added relation: `llos[]`

3. **courseofferings**

   - Added relation: `llosAttainments[]`

4. **faculties**

   - Added relation: `llosCalculated[]`

5. **plos**
   - Added relation: `lloMappings[]`

## API Endpoints (API Endpoints)

### LLO Endpoints (New)

- `GET /api/llos` - Get all LLOs
- `POST /api/llos` - Create LLO
- `PUT /api/llos` - Update LLO
- `GET /api/llos/[id]` - Get single LLO
- `PUT /api/llos/[id]` - Update LLO
- `DELETE /api/llos/[id]` - Delete LLO
- `GET /api/courses/[id]/llos` - Get LLOs for a course
- `POST /api/courses/[id]/llos` - Create LLO for a course

### Updated Endpoints

- All admin endpoints now use `admin` role instead of `super_admin`/`sub_admin`
- Sections endpoints need `sessionType` field

## Next Steps (Agle Steps)

### Priority 1: Database Migration

```bash
npx prisma migrate dev --name add_llo_and_session_type
```

### Priority 2: Update Sections API

- Add `sessionType` to create/update section
- Update validation schema

### Priority 3: Frontend Updates

- LLO management pages
- Session type selector in section forms
- LLO-PLO mapping interface

### Priority 4: Testing

- Test LLO creation
- Test section creation with session type
- Test department scoping

## Important Notes (Important Notes)

1. **Department Isolation**: Har department apna data dekh sakta hai, dusre department ka nahi
2. **Role Hierarchy**: Admin > Teacher > Student
3. **Batch Management**: Batches year-based hain (2021, 2022, etc.)
4. **Session Types**: Sections morning ya evening me ho sakte hain
5. **Learning Outcomes**:
   - Theory courses → CLOs
   - Lab courses → LLOs
   - Dono PLOs se map hote hain

## File Structure (Files Ki Structure)

```
src/
├── app/
│   ├── api/
│   │   ├── llos/              # NEW - LLO endpoints
│   │   ├── clos/              # Existing CLO endpoints
│   │   ├── sections/          # Needs sessionType update
│   │   └── ...                # Other endpoints
│   └── (authenticated-routes)/
│       ├── admin/
│       ├── faculty/
│       └── student/
├── components/
│   ├── assessments/
│   ├── sections/              # Needs sessionType update
│   └── ...
└── lib/
    └── prisma.ts

prisma/
└── schema.prisma              # Updated with LLO and sessionType
```

## Summary (Summary)

**Completed:**

- ✅ Removed super_admin/sub_admin
- ✅ Added LLO model and relationships
- ✅ Added sessionType to sections
- ✅ Created LLO API endpoints

**Remaining:**

- ⏳ Update sections API for sessionType
- ⏳ Frontend components for LLO
- ⏳ Session type selector in forms
- ⏳ Database migration
- ⏳ Testing

System ab department-based hai, har department apna admin panel use karega. LLO support add ho gaya hai lab courses ke liye, aur sections me morning/evening session type add ho gaya hai.
