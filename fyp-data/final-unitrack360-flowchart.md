# UniTrack360: Complete System Flow Chart
## Final Comprehensive Guide

## 🔍 System Role Hierarchy & Access Rules

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                     SUPER ADMIN                          │
│                                                          │
│             (Complete System Control)                    │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ Creates & Manages
                         ▼
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                      SUB ADMIN                           │
│                                                          │
│    (Same access as Super Admin with 3 restrictions:      │
│     Cannot create Sub Admins                             │
│     Cannot edit/delete Super Admin                       │
│     Cannot edit certain critical system settings)        │
│                                                          │
└───┬─────────────────────────────────────────────────┬────┘
    │                                                 │
    │ Creates & Manages                               │ Creates & Manages
    ▼                                                 ▼
┌────────────────────────┐                   ┌─────────────────────────┐
│                        │                   │                         │
│    DEPARTMENT ADMIN    │◄──────────────────┤       TEACHER          │
│                        │   Creates &       │                         │
│  (Department Control)  │    Manages        │  (Course Management)    │
│                        │                   │                         │
└────────────┬───────────┘                   └─────────────────────────┘
             │                                         ▲
             │ Creates & Manages                       │ Teaches
             ▼                                         │
┌────────────────────────┐                   ┌─────────────────────────┐
│                        │                   │                         │
│     CHILD ADMIN        │◄──────────────────┤       STUDENT          │
│                        │   Manages         │                         │
│ (Cannot create more    │                   │    (Personal Access)    │
│  Child Admins or edit  │                   │                         │
│  Dept Admin)           │                   │                         │
│                        │                   │                         │
└────────────────────────┘                   └─────────────────────────┘
```

## 👑 Super Admin User Flow

```
┌──────────────────────────────────────┐
│                                      │
│           SUPER ADMIN                │
│                                      │
└───────┬──────────────────────┬──────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│ System Setup     │  │User Management   │
│                  │  │                  │
└─────┬───────┬────┘  └────┬───────┬─────┘
      │       │            │       │
      ▼       ▼            ▼       ▼
┌──────────┐ ┌────────┐ ┌──────┐ ┌──────────┐
│Department│ │Academic│ │Create│ │Create Dept│
│  Setup   │ │Calendar│ │Sub   │ │  Admin    │
└──────────┘ └────────┘ │Admin │ └──────────┘
                        └──────┘            
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│OBE Configuration │  │Class Scheduling  │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Define  │ │Create │ │Configure │ │Assign    │
│PLOs    │ │Grading│ │Time Slots│ │Classes   │
└────────┘ │Policy │ └──────────┘ │& Rooms   │
           └───────┘              └──────────┘

┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Reports & Analysis│  │System Settings   │
│                  │  │                  │
└────┬──────┬──────┘  └────┬───────┬─────┘
     │      │              │       │
     ▼      ▼              ▼       ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌────────┐
│University│ │OBE   │ │Security  │ │Backup &│
│Statistics│ │Reports│ │Settings  │ │Recovery│
└──────────┘ └───────┘ └──────────┘ └────────┘
```

## 🔑 Sub Admin User Flow

```
┌──────────────────────────────────────┐
│                                      │
│             SUB ADMIN                │
│                                      │
└───────┬──────────────────────┬──────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│                  │  │User Management   │
│ System Management│  │                  │
│                  │  │(Cannot edit      │
└─────┬───────┬────┘  │Super Admin)      │
      │       │       └────┬───────┬─────┘
      ▼       ▼            │       │
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Department│ │Academic│ │Create Dept│ │   User   │
│Management│ │Calendar│ │  Admin    │ │Activation│
└──────────┘ └────────┘ └──────────┘ └──────────┘
                        
┌──────────────────┐  ┌──────────────────┐
│                  │  │Class Scheduling  │
│OBE Configuration │  │                  │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Configure│ │Update │ │Configure │ │Assign    │
│PLO/CLO  │ │Grading│ │Time Slots│ │Classes   │
│Structure│ │Schemes│ └──────────┘ │& Rooms   │
└────────┘ └───────┘              └──────────┘

┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Reports & Analysis│  │   Monitoring     │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Generate│ │Export │ │Department│ │View Admin│
│Reports │ │Data   │ │Analytics │ │Activity  │
└────────┘ └───────┘ └──────────┘ │Logs      │
                                  └──────────┘
```

## 🏫 Department Admin User Flow

```
┌──────────────────────────────────────┐
│                                      │
│         DEPARTMENT ADMIN             │
│                                      │
└───────┬──────────────────────┬──────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│                  │  │User Management   │
│Department Setup  │  │                  │
│                  │  │                  │
└─────┬───────┬────┘  └────┬───────┬─────┘
      │       │            │       │
      ▼       ▼            ▼       ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Program   │ │Course  │ │Create    │ │Create    │
│Management│ │Setup   │ │Teacher   │ │Child Admin│
└──────────┘ └────────┘ │Accounts  │ │Accounts  │
                        └──────────┘ └──────────┘
                        
┌──────────────────┐  ┌──────────────────┐
│                  │  │Class Scheduling  │
│Student Management│  │                  │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Create  │ │Manage │ │Create    │ │Assign    │
│Student │ │Batches│ │Class     │ │Teachers  │
│Accounts│ │       │ │Schedule  │ │to Classes│
└────────┘ └───────┘ └──────────┘ └──────────┘

┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│OBE Management    │  │Results Management│
│                  │  │                  │
└────┬──────┬──────┘  └────┬───────┬─────┘
     │      │              │       │
     ▼      ▼              ▼       ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌────────┐
│Define  │ │Review │ │Verify    │ │Publish │
│PLOs &  │ │CLO/PLO│ │Results   │ │Results │
│CLOs    │ │Mapping│ └──────────┘ └────────┘
└────────┘ └───────┘              
```

## 📝 Child Admin User Flow

```
┌──────────────────────────────────────┐
│                                      │
│          CHILD ADMIN                 │
│       (Cannot create more Child      │
│        Admins or edit Dept Admin)    │
│                                      │
└───────┬──────────────────────┬──────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│                  │  │User Assistance   │
│Data Management   │  │                  │
│                  │  │                  │
└─────┬───────┬────┘  └────┬───────┬─────┘
      │       │            │       │
      ▼       ▼            ▼       ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Manage    │ │Update  │ │Process   │ │Reset     │
│Class     │ │Student │ │Teacher   │ │Student   │
│Schedules │ │Records │ │Requests  │ │Passwords │
└──────────┘ └────────┘ └──────────┘ └──────────┘
                        
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Report Generation │  │Administrative    │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Generate│ │Export │ │Process   │ │Monitor   │
│Standard│ │Custom │ │Leave     │ │Attendance│
│Reports │ │Reports│ │Approvals │ │Status    │
└────────┘ └───────┘ └──────────┘ └──────────┘
```

## 👨‍🏫 Teacher User Flow

```
┌──────────────────────────────────────┐
│                                      │
│              TEACHER                 │
│                                      │
└───────┬──────────────────────┬──────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Course Management │  │Schedule & Classes│
│                  │  │                  │
└─────┬───────┬────┘  └────┬───────┬─────┘
      │       │            │       │
      ▼       ▼            ▼       ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Define    │ │Map CLOs│ │View Class│ │View Room │
│Course CLOs│ │to PLOs │ │Schedules│ │Assignment│
└──────────┘ └────────┘ └──────────┘ └──────────┘
                        
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Attendance        │  │Assessment        │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Mark    │ │Review │ │Create    │ │Enter     │
│Daily   │ │Student│ │Assessments│ │Student   │
│Attend. │ │Attend.│ │          │ │Marks     │
└────────┘ └───────┘ └──────────┘ └──────────┘

┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Results & Analysis│  │Student Management│
│                  │  │                  │
└────┬──────┬──────┘  └────┬───────┬─────┘
     │      │              │       │
     ▼      ▼              ▼       ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌────────┐
│Calculate│ │View  │ │Review    │ │Process │
│Course   │ │CLO   │ │Leave     │ │Attend. │
│Results  │ │Reports│ │Requests  │ │Correct.│
└────────┘ └───────┘ └──────────┘ └────────┘
```

## 🎓 Student User Flow

```
┌──────────────────────────────────────┐
│                                      │
│             STUDENT                  │
│                                      │
└───────┬──────────────────────┬──────┘
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Profile Management│  │Class Schedule    │
│                  │  │                  │
└─────┬───────┬────┘  └────┬───────┬─────┘
      │       │            │       │
      ▼       ▼            ▼       ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│View      │ │Update  │ │View      │ │View Room │
│Personal  │ │Contact │ │Class     │ │Details   │
│Profile   │ │Info    │ │Timetable │ │          │
└──────────┘ └────────┘ └──────────┘ └──────────┘
                        
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Attendance        │  │Academic Records  │
│                  │  │                  │
└────┬──────┬──────┘  └────┬──────┬──────┘
     │      │              │      │
     ▼      ▼              ▼      ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│View    │ │Submit │ │View      │ │Track     │
│Attend. │ │Leave  │ │Course    │ │Enrollment│
│Status  │ │Request│ │Details   │ │Status    │
└────────┘ └───────┘ └──────────┘ └──────────┘

┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│Assessment & Results│ │Requests & Reports│
│                  │  │                  │
└────┬──────┬──────┘  └────┬───────┬─────┘
     │      │              │       │
     ▼      ▼              ▼       ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌────────┐
│View    │ │Track  │ │Request   │ │Download│
│Marks & │ │CLO/PLO│ │Attendance│ │Transc- │
│Results │ │Progress│ │Correction│ │ript    │
└────────┘ └───────┘ └──────────┘ └────────┘
```

## 📊 Class Schedule Management Flow

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                CLASS SCHEDULE SETUP                  │
│           (Admin & Department Admin Level)           │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│              DEFINE TIME PARAMETERS                  │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │   Define    │   │   Create    │  │  Define    │  │
│   │  Sessions   │   │ Time Slots  │  │  Weekdays  │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│                CONFIGURE LOCATIONS                   │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │   Define    │   │  Set Room   │  │ Configure  │  │
│   │  Buildings  │   │ Capacities  │  │ Lab Spaces │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│                 ASSIGN CLASSES                       │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │   Assign    │   │   Assign    │  │  Set Class │  │
│   │  Courses    │   │   Teachers  │  │  Duration  │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│              CONFLICT RESOLUTION                     │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │   Detect    │   │  Resolve    │  │ Finalize   │  │
│   │  Conflicts  │   │  Conflicts  │  │ Schedule   │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│              SCHEDULE PUBLICATION                    │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Publish to  │   │ Publish to  │  │ Publish to │  │
│   │  Teachers   │   │  Students   │  │ Department │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 🧑‍💼 Schedule Viewing Flow (All Users)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                SCHEDULE ACCESS                       │
│                                                      │
└────┬───────────────┬─────────────────┬───────────────┘
     │               │                 │
     ▼               ▼                 ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│             │ │             │ │                 │
│ TEACHER     │ │ STUDENT     │ │ ADMIN/DEPT ADMIN│
│ VIEW        │ │ VIEW        │ │ VIEW            │
│             │ │             │ │                 │
└──────┬──────┘ └──────┬──────┘ └─────────┬───────┘
       │               │                  │
       ▼               ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│ Personal    │ │ Personal    │ │ Department-wide │
│ Teaching    │ │ Class       │ │ Schedule        │
│ Schedule    │ │ Schedule    │ │ Overview        │
└──────┬──────┘ └──────┬──────┘ └─────────┬───────┘
       │               │                  │
       ▼               ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│ View Rooms  │ │ View Courses│ │ View All        │
│ & Students  │ │ & Teachers  │ │ Classes & Rooms │
└──────┬──────┘ └──────┬──────┘ └─────────┬───────┘
       │               │                  │
       ▼               ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│ Export      │ │ Daily/Weekly│ │ Schedule        │
│ Schedule    │ │ View        │ │ Management      │
└─────────────┘ └─────────────┘ └─────────────────┘
```

## 🖥️ Feature Access by Role

| Feature | Super Admin | Sub Admin | Dept Admin | Child Admin | Teacher | Student |
|---------|-------------|-----------|------------|-------------|---------|---------|
| **User Management** |
| Create Sub Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit/Delete Super Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Dept Admin | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Child Admin | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Dept Admin | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Teacher | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Student | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Bulk Import Students | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View All Users | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deactivate Users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reset Passwords | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **University Structure** |
| Create Departments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Programs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Courses | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign Courses | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Batches | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Schedule Management** |
| Define Time Slots | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Room Registry | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Class Schedule | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign Teachers to Classes | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Schedule (All) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Personal Schedule | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OBE Framework** |
| Define PLOs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create CLOs | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Map CLOs to PLOs | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Configure Assessment Types | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Define Grading Policy | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| SDG Alignment | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Attendance Management** |
| Create Class Schedules | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mark Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View All Attendance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configure Eligibility Rules | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Leave Applications | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Submit Leave Applications | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Attendance Correction | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Assessment Management** |
| Create Assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Enter Student Marks | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Map Assessments to CLOs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View All Assessments | ✅ | ✅ | ✅ | ✅ | ❌ |