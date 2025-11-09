# 🔗 OBE System - Module Relationships & Dependencies

## 📊 Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN MODULES                               │
└─────────────────────────────────────────────────────────────────────┘

LEVEL 1: FOUNDATION (No Dependencies)
┌──────────────┐
│   Settings   │
└──────────────┘

┌──────────────┐
│ Departments  │
└──────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
LEVEL 2: ACADEMIC STRUCTURE
┌──────────────┐                    ┌──────────────┐
│   Programs   │                    │   Courses    │
└──────────────┘                    └──────────────┘
       │                                     │
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│     PLOs     │                    │     CLOs     │
└──────────────┘                    └──────────────┘
       │                                     │
       │                                     │
       └──────────────┬──────────────────────┘
                      │
                      ▼
            ┌─────────────────────┐
            │ CLO-PLO Mappings    │
            └─────────────────────┘

LEVEL 3: TIME & ORGANIZATION
┌──────────────┐
│  Semesters   │
└──────────────┘
       │
       │
       ▼
┌──────────────┐
│   Batches    │
└──────────────┘
       │
       │ (requires Program)
       │

LEVEL 4: USER MANAGEMENT
┌──────────────┐                    ┌──────────────┐
│   Faculty    │                    │   Students   │
└──────────────┘                    └──────────────┘
       │                                     │
       │ (requires Department)              │ (requires Department, Program, Batch)
       │                                     │

LEVEL 5: COURSE DELIVERY
       │                                     │
       │                                     │
       ▼                                     ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Course Offerings    │          │      Sections        │
└──────────────────────┘          └──────────────────────┘
       │                                     │
       │ (requires Course + Semester)        │ (requires Course Offering + Batch + Faculty)
       │                                     │

LEVEL 6: ASSESSMENT
       │                                     │
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│ Assessments  │                    │  Sessions    │
└──────────────┘                    └──────────────┘
       │                                     │
       │ (requires Course Offering)         │ (optional, linked to Sections)
       │                                     │

LEVEL 7: EVALUATION
       │
       │
       ▼
┌──────────────┐
│ Marks Entry  │
└──────────────┘
       │
       │ (requires Assessment + Students)
       │
       ▼
┌──────────────────────┐
│ Result Evaluation    │
└──────────────────────┘

LEVEL 8: OUTCOME ANALYSIS
       │
       │
       ▼
┌──────────────────────┐
│  CLO Attainments    │
└──────────────────────┘
       │
       │ (requires Marks + CLOs)
       │
       ▼
┌──────────────────────┐
│  PLO Attainments    │
└──────────────────────┘
       │
       │ (requires CLO Attainments + CLO-PLO Mappings)
       │
       ▼
┌──────────────┐
│  Analytics   │
└──────────────┘

LEVEL 9: REPORTING
       │
       │
       ▼
┌──────────────┐                    ┌──────────────┐
│ OBE Reports  │                    │ Transcripts  │
└──────────────┘                    └──────────────┘
       │                                     │
       │ (requires PLO Attainments)         │ (requires Student + Grades)
       │                                     │
```

---

## 🔄 Data Flow Diagram

### Complete OBE Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │  Academic    │    │    User      │    │   Time       │     │
│  │  Structure   │    │  Management  │    │  Management  │     │
│  │              │    │              │    │              │     │
│  │ • Programs   │    │ • Faculty    │    │ • Semesters  │     │
│  │ • Courses    │    │ • Students   │    │ • Batches    │     │
│  │ • PLOs       │    │              │    │              │     │
│  │ • CLOs       │    │              │    │              │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MAPPING LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│              ┌──────────────────────────┐                        │
│              │   CLO-PLO Mappings       │                        │
│              │   (Links Outcomes)      │                        │
│              └──────────────────────────┘                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Course Offerings │ ──────> │    Sections      │            │
│  │                  │         │                  │            │
│  │ • Course         │         │ • Faculty        │            │
│  │ • Semester       │         │ • Students       │            │
│  │                  │         │ • Sessions       │            │
│  └──────────────────┘         └──────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASSESSMENT LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  Assessments     │ ──────> │   Marks Entry    │            │
│  │                  │         │                  │            │
│  │ • Quiz           │         │ • Student Marks  │            │
│  │ • Assignment     │         │ • Assessment     │            │
│  │ • Exam           │         │   Results        │            │
│  └──────────────────┘         └──────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CALCULATION LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ CLO Attainments  │ ──────> │ PLO Attainments  │            │
│  │                  │         │                  │            │
│  │ • Course Level   │         │ • Program Level  │            │
│  │ • Student Level  │         │ • Batch Level    │            │
│  │ • Class Average  │         │ • Overall        │            │
│  └──────────────────┘         └──────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │    Analytics     │    │     Reports      │                  │
│  │                  │    │                  │                  │
│  │ • Dashboards     │    │ • OBE Reports   │                  │
│  │ • Charts         │    │ • Transcripts    │                  │
│  │ • Trends         │    │ • Performance    │                  │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Module Dependency Matrix

| Module | Depends On | Required For |
|--------|-----------|--------------|
| **Settings** | None | All modules |
| **Departments** | None | Programs, Courses, Faculty, Students |
| **Programs** | Departments | PLOs, Batches, Students |
| **PLOs** | Programs | CLO-PLO Mappings, PLO Attainments |
| **Courses** | Departments | CLOs, Course Offerings |
| **CLOs** | Courses | CLO-PLO Mappings, CLO Attainments |
| **CLO-PLO Mappings** | CLOs, PLOs | PLO Attainments |
| **Semesters** | None | Course Offerings, PLO Attainments |
| **Batches** | Programs | Sections, Students |
| **Faculty** | Departments | Sections, Assessments |
| **Students** | Departments, Programs, Batches | Sections, Marks Entry |
| **Course Offerings** | Courses, Semesters | Sections, Assessments |
| **Sections** | Course Offerings, Batches, Faculty | Assessments, Sessions |
| **Sessions** | Sections | Optional tracking |
| **Assessments** | Course Offerings | Marks Entry |
| **Marks Entry** | Assessments, Students | CLO Attainments |
| **Result Evaluation** | Marks Entry | CLO Attainments |
| **CLO Attainments** | Marks Entry, CLOs | PLO Attainments |
| **PLO Attainments** | CLO Attainments, CLO-PLO Mappings | OBE Reports |
| **Analytics** | All above | Reports |
| **OBE Reports** | PLO Attainments | Documentation |
| **Transcripts** | Students, Grades | Official Records |

---

## 🎯 Critical Path (Minimum Required)

For a working OBE system, you MUST have:

```
1. Department
   └─> 2. Program
        └─> 3. PLOs
             └─> 4. Course
                  └─> 5. CLOs
                       └─> 6. CLO-PLO Mapping
                            └─> 7. Semester
                                 └─> 8. Batch
                                      └─> 9. Faculty
                                           └─> 10. Students
                                                └─> 11. Course Offering
                                                     └─> 12. Section
                                                          └─> 13. Assessment
                                                               └─> 14. Marks Entry
                                                                    └─> 15. CLO Attainments
                                                                         └─> 16. PLO Attainments
```

---

## 🔍 Module Relationships Explained

### 1. Academic Structure Relationships
```
Department
  ├─> Programs (1:N)
  │     └─> PLOs (1:N)
  │
  ├─> Courses (1:N)
  │     └─> CLOs (1:N)
  │
  ├─> Faculty (1:N)
  └─> Students (1:N)

Program
  ├─> PLOs (1:N)
  ├─> Batches (1:N)
  ├─> Students (1:N)
  └─> Courses (M:N via programtocourse)
```

### 2. Outcome Relationships
```
PLO ←─── CLO-PLO Mapping ───→ CLO
 │                              │
 │                              │
 └─── PLO Attainment ←─── CLO Attainment
```

### 3. Course Delivery Relationships
```
Course + Semester → Course Offering
                      │
                      ├─> Sections (1:N)
                      │     ├─> Faculty (N:1)
                      │     ├─> Batch (N:1)
                      │     └─> Students (M:N)
                      │
                      └─> Assessments (1:N)
                            └─> Marks Entry (1:N)
```

### 4. Assessment to Outcome Flow
```
Assessment
  └─> Marks Entry
       └─> CLO Attainments (calculated)
            └─> PLO Attainments (aggregated via mappings)
                 └─> Analytics & Reports
```

---

## ⚙️ Calculation Dependencies

### CLO Attainment Calculation
**Requires:**
- Assessment marks (from Marks Entry)
- CLO definitions (from CLOs)
- Assessment-to-CLO mapping (implicit or explicit)

**Produces:**
- Individual student CLO percentages
- Class average CLO percentages
- Attainment status (Attained/Not Attained)

### PLO Attainment Calculation
**Requires:**
- CLO Attainments (calculated)
- CLO-PLO Mappings (defined)
- Course weightage (credit hours)

**Produces:**
- Individual student PLO percentages
- Batch/Program PLO percentages
- Overall PLO attainment status

---

## 🚨 Common Dependency Issues

### Issue 1: Cannot create Section
**Problem:** Missing dependencies
**Solution:** Ensure you have:
- Course Offering (requires Course + Semester)
- Batch (requires Program)
- Faculty (requires Department)

### Issue 2: Cannot calculate CLO Attainments
**Problem:** Missing data
**Solution:** Ensure you have:
- Assessments created
- Marks entered for assessments
- CLOs defined for the course

### Issue 3: Cannot calculate PLO Attainments
**Problem:** Missing mappings
**Solution:** Ensure you have:
- CLO Attainments calculated
- CLO-PLO Mappings defined
- All CLOs mapped to at least one PLO

### Issue 4: Cannot generate Reports
**Problem:** Missing attainments
**Solution:** Ensure you have:
- PLO Attainments calculated
- Sufficient data for the selected period

---

## 📊 Module Access Patterns

### Read-Only Modules (View Only)
- Analytics
- Reports (after generation)
- Transcripts (after generation)
- PLO Attainments (calculated)
- CLO Attainments (calculated)

### Create-Only Modules (No Edit)
- Marks Entry (can update before finalization)
- Attainments (auto-calculated)

### Full CRUD Modules
- Departments
- Programs
- Courses
- PLOs
- CLOs
- Semesters
- Batches
- Faculty
- Students
- Sections
- Assessments
- Course Offerings

---

## 🔄 Update Propagation

When you update certain modules, related calculations may need to be refreshed:

```
Update Marks → Recalculate CLO Attainments → Recalculate PLO Attainments
Update CLO-PLO Mapping → Recalculate PLO Attainments
Update Assessment Weightage → Recalculate CLO Attainments
Add/Remove CLO → Recalculate CLO Attainments
Add/Remove PLO → Recalculate PLO Attainments
```

---

**Note:** Always verify dependencies before creating or modifying modules to ensure data integrity.

