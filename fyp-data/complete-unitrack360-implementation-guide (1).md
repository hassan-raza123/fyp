- Notification history should be maintained
- Notification overload should be prevented

---

## Process Flows

### User Authentication Flow

```
┌───────────────────┐
│                   │
│  User accesses    │
│  login page       │
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│                   │
│  User enters      │
│  credentials      │
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│                   │
│  System validates │
│  credentials      │
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐      ┌───────────────────┐
│                   │ No   │                   │
│  Valid            ├─────▶│  Show error       │
│  credentials?     │      │  message          │
│                   │      │                   │
└─────────┬─────────┘      └───────────────────┘
          │ Yes
          ▼
┌───────────────────┐
│                   │
│  Create session   │
│  & JWT token      │
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│                   │
│  Detect user      │
│  role             │
│                   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│                   │
│  Redirect to      │
│  role-specific    │
│  dashboard        │
│                   │
└───────────────────┘
```

### Attendance Marking Process

```
┌──────────────┐
│              │
│  Teacher     │
│  Logs In     │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Views Class  │
│ Schedule     │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Selects      │
│ Class/Date   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐       ┌──────────────┐
│              │  No   │              │
│ Current      ├──────▶│ Requires     │
│ Date?        │       │ Authorization│
│              │       │              │
└──────┬───────┘       └──────┬───────┘
       │ Yes                  │
       │                      │
       │                      ▼
       │               ┌──────────────┐
       │               │              │
       │               │ Get          │
       │               │ Approval     │
       │               │              │
       │               └──────┬───────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│              │       │              │
│ Views Student│◀──────┤ If Approved  │
│ List         │       │              │
│              │       │              │
└──────┬───────┘       └──────────────┘
       │
       ▼
┌──────────────┐
│              │
│ Marks Status │
│ (P/A/L)      │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Submits      │
│ Attendance   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐
│              │     │               │
│ System       │────▶│ Student Views │
│ Processes    │     │ Attendance    │
│              │     │               │
└──────┬───────┘     └───────────────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐
│              │     │               │
│ System       │────▶│ Admin Views   │
│ Calculates   │     │ Statistics    │
│ Statistics   │     │               │
└──────────────┘     └───────────────┘
```

### Leave Application Process

```
┌──────────────┐
│              │
│  Student     │
│  Submits     │
│  Leave App   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Uploads      │
│ Supporting   │
│ Documents    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ System       │
│ Notifies     │
│ Teacher      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Teacher      │
│ Reviews      │
│ Application  │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│              │ No   │              │
│ Approved?    ├─────▶│ Application  │
│              │      │ Rejected     │
└──────┬───────┘      └──────┬───────┘
       │ Yes                 │
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│              │      │              │
│ System       │      │ Notification │
│ Updates      │      │ Sent to      │
│ Attendance   │      │ Student      │
└──────┬───────┘      └──────────────┘
       │
       ▼
┌──────────────┐     
│              │     
│ System       │     
│ Sends        │     
│ Notification │     
└──────┬───────┘     
       │
       ▼
┌──────────────┐     
│              │     
│ Student      │     
│ Receives     │     
│ Notification │     
└──────────────┘     
```

### Assessment Creation Process

```
┌──────────────┐
│              │
│  Teacher     │
│  Creates     │
│  Assessment  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Sets Details │
│ (Title, Marks)│
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Maps to CLOs │
│ with Weights │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Sets Due     │
│ Date/Time    │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Saves        │
│ Assessment   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ System       │
│ Notifies     │
│ Students     │
└──────────────┘
```

### Assessment Marks Process

```
┌──────────────┐
│              │
│  Teacher     │
│  Conducts    │
│  Assessment  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Opens Marks  │
│ Entry Form   │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Enters Marks │
│ for Students │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Adds         │
│ Comments     │
│ (Optional)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Submits      │
│ Marks        │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐
│              │     │               │
│ System       │────▶│ Student Views │
│ Processes    │     │ Marks         │
│              │     │               │
└──────┬───────┘     └───────────────┘
       │
       ▼
┌──────────────┐     
│              │     
│ Calculates   │     
│ CLO          │     
│ Achievement  │     
└──────┬───────┘     
       │
       ▼
┌──────────────┐     ┌───────────────┐
│              │     │               │
│ Updates      │────▶│ Teacher Views │
│ CLO          │     │ CLO Reports   │
│ Dashboard    │     │               │
└──────────────┘     └───────────────┘
```

### CLO Achievement Calculation Flow

```
┌──────────────────────────┐
│                          │
│      Assessment Data     │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│                          │
│  Identify CLO-Mapped     │
│      Assessments         │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│                          │
│ Retrieve Student Marks   │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│                          │
│   Apply CLO Mapping      │
│      Weights             │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│                                                  │
│ CLO Achievement = Σ(Assessment Score × Weight)   │
│                   ────────────────────────── ×100│
│                    Σ(Assessment Weight)          │
│                                                  │
└─────────────┬────────────────────────────────────┘
              │
              ▼
┌──────────────────────────┐     ┌────────────────────┐
│                          │     │                    │
│  Store CLO Achievement   │────▶│  Update Student    │
│       Records            │     │  CLO Dashboard     │
│                          │     │                    │
└─────────────┬────────────┘     └────────────────────┘
              │
              ▼
┌──────────────────────────┐     ┌────────────────────┐
│                          │     │                    │
│  Calculate Course-level  │────▶│  Update Course     │
│     CLO Achievement      │     │  CLO Dashboard     │
│                          │     │                    │
└──────────────────────────┘     └────────────────────┘
```

### PLO Attainment Calculation Flow

```
┌──────────────────────────┐
│                          │
│    CLO Achievement       │
│        Data              │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│                          │
│  Retrieve CLO-PLO        │
│     Mappings             │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│                          │
│   Apply CLO-PLO          │
│  Mapping Weights         │
│                          │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│                                                  │
│ PLO Attainment = Σ(CLO Achievement × Weight)     │
│                  ────────────────────────        │
│                   Σ(CLO-PLO Weight)              │
│                                                  │
└─────────────┬────────────────────────────────────┘
              │
              ▼
┌──────────────────────────┐     ┌────────────────────┐
│                          │     │                    │
│  Store PLO Attainment    │────▶│  Update Student    │
│       Records            │     │  PLO Dashboard     │
│                          │     │                    │
└─────────────┬────────────┘     └────────────────────┘
              │
              ▼
┌──────────────────────────┐     ┌────────────────────┐
│                          │     │                    │
│  Calculate Program-level │────▶│  Update Program    │
│     PLO Attainment       │     │  PLO Dashboard     │
│                          │     │                    │
└──────────────────────────┘     └────────────────────┘
```

### Result Processing Workflow

```
┌──────────────┐
│              │
│  Teacher     │
│  Completes   │
│  All Marks   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Dept Admin   │
│ Initiates    │
│ Processing   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ System       │
│ Calculates   │
│ Course Results│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ System       │
│ Computes GPA │
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ System       │
│ Calculates   │
│ CGPA         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│              │
│ Dept Admin   │
│ Verifies     │
│ Results      │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐
│              │     │               │
│ Dept Admin   │────▶│ Student Views │
│ Publishes    │     │ Results       │
│ Results      │     │               │
└──────────────┘     └───────────────┘
```

### Class Schedule Creation Flow

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│             DEFINE ACADEMIC PARAMETERS               │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Define      │   │ Define      │  │ Define     │  │
│   │ Sessions    │   │ Semesters   │  │ Holidays   │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│               DEFINE TIME PARAMETERS                 │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Create      │   │ Define      │  │ Set Time   │  │
│   │ Weekdays    │   │ Periods     │  │ Slots      │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│                CONFIGURE LOCATIONS                   │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Define      │   │ Set Room    │  │ Configure  │  │
│   │ Buildings   │   │ Capacities  │  │ Lab Spaces │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│                 ASSIGN CLASSES                       │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Select      │   │ Assign      │  │ Set Class  │  │
│   │ Courses     │   │ Teachers    │  │ Duration   │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│              CONFLICT RESOLUTION                     │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Detect      │   │ Resolve     │  │ Finalize   │  │
│   │ Conflicts   │   │ Conflicts   │  │ Schedule   │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│              SCHEDULE PUBLICATION                    │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Publish to  │   │ Publish to  │  │ Publish to │  │
│   │ Teachers    │   │ Students    │  │ Department │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### User Creation (Admin-Driven) Flow

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                   USER CREATION                      │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│                SELECT USER TYPE                      │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Super Admin │   │ Dept. Admin │  │ Teacher    │  │
│   │ Sub Admin   │   │ Child Admin │  │ Student    │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│               ENTER USER DETAILS                     │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Basic       │   │ Contact     │  │ Role-specific │
│   │ Information │   │ Information │  │ Details    │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│               ASSIGN PERMISSIONS                     │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Select      │   │ Customize   │  │ Review     │  │
│   │ Role        │   │ Permissions │  │ Access     │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                                                      │
│               ACCOUNT CREATION                       │
│                                                      │
│   ┌─────────────┐   ┌─────────────┐  ┌────────────┐  │
│   │ Generate    │   │ Send        │  │ Log        │  │
│   │ Credentials │   │ Invitation  │  │ Creation   │  │
│   └─────────────┘   └─────────────┘  └────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## User Interfaces

### Key Interface Components

#### 1. Global Navigation

The global navigation system is role-based, showing only options relevant to the user's permissions:

```
┌─────────────────────────────────────────────────────────────────┐
│ UniTrack360                            User: [Name] ▼           │
├─────────┬───────────────────────────────────────────────────────┤
│         │                                                       │
│ NAVIGATION │                MAIN CONTENT AREA                      │
│         │                                                       │
│ • Dashboard │                                                       │
│ • Users     │                                                       │
│ • Structure │                                                       │
│ • Schedule  │                                                       │
│ • Attendance│                                                       │
│ • OBE       │                                                       │
│ • Assessment│                                                       │
│ • Results   │                                                       │
│ • Reports   │                                                       │
│ • Settings  │                                                       │
│         │                                                       │
│         │                                                       │
│         │                                                       │
│         │                                                       │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

#### 2. Super Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                                 User: [Admin] ▼        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ UNIVERSITY OVERVIEW                                             │
│ ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐          │
│ │ Students │ │ Teachers │ │ Courses   │ │ Depts     │          │
│ │  5,235   │ │   342    │ │   256     │ │   12      │          │
│ └──────────┘ └──────────┘ └───────────┘ └───────────┘          │
│                                                                 │
│ RECENT ACTIVITY                    │  SYSTEM ALERTS             │
│ ┌─────────────────────────────────┤  ┌─────────────────────────┤
│ │ • Teacher T.Ahmed marked att... │  │ ⚠️ 3 teachers have pen...│
│ │ • New student S.Khan added to BS│  │ ⚠️ Grade submission dea..│
│ │ • Grade submission completed for│  │ ⚠️ System backup schedu..│
│ │ • Department Admin updated PLO..│  │ ℹ️ 25 new students enro..│
│ └─────────────────────────────────┘  └─────────────────────────┘
│                                                                 │
│ DEPARTMENTAL PERFORMANCE                                        │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │                                                             ││
│ │        [Bar chart showing department-wise statistics]       ││
│ │                                                             ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ QUICK ACTIONS                                                   │
│ ┌──────────────┐ ┌────────────────┐ ┌─────────────────┐        │
│ │ Create User  │ │ View Reports   │ │ System Settings │        │
│ └──────────────┘ └────────────────┘ └─────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Teacher Attendance Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Attendance > Mark Attendance                User: [Teacher] ▼    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CLASS SELECTION                                                 │
│ ┌───────────────────────┐  ┌────────────────┐  ┌───────────────┐│
│ │ Course: CS101 - Intro▼│  │ Batch: BSCS-F23▼│  │ Date: [Today]▼││
│ └───────────────────────┘  └────────────────┘  └───────────────┘│
│                                                                 │
│ ATTENDANCE MARKING                                              │
│ ┌─────┬────────────────────┬─────────────┬────────────────────┐ │
│ │ No. │ Student            │ Status      │ Comments           │ │
│ ├─────┼────────────────────┼─────────────┼────────────────────┤ │
│ │ 1.  │ Ali Ahmed (S001)   │ ○ Present   │                    │ │
│ │     │                    │ ○ Absent    │ [____________]     │ │
│ │     │                    │ ○ Late      │                    │ │
│ ├─────┼────────────────────┼─────────────┼────────────────────┤ │
│ │ 2.  │ Sara Khan (S002)   │ ● Present   │                    │ │
│ │     │                    │ ○ Absent    │ [____________]     │ │
│ │     │                    │ ○ Late      │                    │ │
│ ├─────┼────────────────────┼─────────────┼────────────────────┤ │
│ │ 3.  │ Umar Malik (S003)  │ ○ Present   │                    │ │
│ │     │                    │ ● Absent    │ [Medical Leave]    │ │
│ │     │                    │ ○ Late      │                    │ │
│ └─────┴────────────────────┴─────────────┴────────────────────┘ │
│                                                                 │
│ ACTIONS                                                         │
│ ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐   │
│ │ Mark All Present │ │ Save Draft   │ │ Submit Attendance  │   │
│ └──────────────────┘ └──────────────┘ └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Student Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Dashboard                               User: [Student] ▼        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ACADEMIC OVERVIEW                                               │
│ ┌───────────────┐ ┌───────────────┐ ┌──────────────────────┐   │
│ │  Attendance   │ │     GPA       │ │  Completed Credits   │   │
│ │    87.5%      │ │     3.42      │ │      45 / 136        │   │
│ └───────────────┘ └───────────────┘ └──────────────────────┘   │
│                                                                 │
│ CURRENT COURSES                                                 │
│ ┌──────────┬───────────┬───────────┬───────────────────────┐   │
│ │ Course   │ Attendance│ Marks     │ Status                │   │
│ ├──────────┼───────────┼───────────┼───────────────────────┤   │
│ │ CS303    │ 92%       │ 87/100    │ Good Standing         │   │
│ │ MTH201   │ 85%       │ 72/100    │ Good Standing         │   │
│ │ PHY101   │ 75%       │ 63/100    │ At Risk!              │   │
│ │ ENG202   │ 98%       │ 91/100    │ Good Standing         │   │
│ └──────────┴───────────┴───────────┴───────────────────────┘   │
│                                                                 │
│ CLASS SCHEDULE TODAY                                            │
│# UniTrack360: Complete Implementation Guide
## Comprehensive System Flow & Development Documentation

This document provides a complete, end-to-end blueprint for building the UniTrack360 system, covering all aspects from user authentication to system deployment. This guide is designed for developers to implement the system without requiring additional documentation.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [User Authentication & Authorization](#user-authentication--authorization)
3. [Database Schema](#database-schema)
4. [User Role Hierarchy](#user-role-hierarchy)
5. [Module Descriptions](#module-descriptions)
6. [Process Flows](#process-flows)
7. [User Interfaces](#user-interfaces)
8. [API Endpoints](#api-endpoints)
9. [Implementation Plan](#implementation-plan)
10. [Testing Strategy](#testing-strategy)

---

## System Architecture

### Overview Architecture
```
┌───────────────────────────────────────────────────────┐
│                                                       │
│                  CLIENT LAYER                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Admin      │  │ Teacher    │  │ Student    │       │
│  │ Interface  │  │ Interface  │  │ Interface  │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                                                       │
│                  API LAYER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Next.js    │  │ RESTful    │  │ Authentication│    │
│  │ API Routes │  │ Endpoints  │  │ Middleware  │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                                                       │
│                  SERVICE LAYER                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ User       │  │ Academic   │  │ Attendance │       │
│  │ Services   │  │ Services   │  │ Services   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ OBE        │  │ Assessment │  │ Results    │       │
│  │ Services   │  │ Services   │  │ Services   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                                                       │
│                 DATA ACCESS LAYER                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Prisma ORM │  │ Query      │  │ Data       │       │
│  │ Client     │  │ Builder    │  │ Validation │       │
│  └────────────┘  └────────────┘  └────────────┘       │
│                                                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                                                       │
│                 DATABASE LAYER                        │
│  ┌────────────────────────────────────────────┐       │
│  │              MySQL Database                 │       │
│  └────────────────────────────────────────────┘       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **State Management**: React Context API or Zustand
- **UI Components**: Shadcn UI components
- **Charts**: Recharts for data visualization
- **Form Handling**: React Hook Form with Zod validation

---

## User Authentication & Authorization

### Authentication Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │
│ User enters  │───▶│  Validate    │───▶│ Generate JWT │
│ credentials  │    │  credentials │    │   token      │
│              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │
│ User is      │◀───│ Store token  │◀───│  Set session │
│ redirected   │    │ in browser   │    │  cookie      │
│ to dashboard │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Authorization Process

1. **Role Detection**:
   - Upon login, user's role is fetched from database
   - Role is included in JWT token
   - Role determines accessible features and routes

2. **Permission Checking**:
   - Middleware checks user's role for each request
   - Routes are protected based on role
   - UI components are conditionally rendered based on permissions

3. **Token Validation**:
   - JWT token is validated on each request
   - Expired tokens require re-authentication
   - Token includes user ID, role, and permissions

4. **Session Management**:
   - Active sessions tracked in database
   - Forced logout capability for administrators
   - Session timeout after period of inactivity

---

## Database Schema

### Core Tables

```sql
-- Users and Authentication
CREATE TABLE Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  contactNumber VARCHAR(20),
  userType ENUM('SUPER_ADMIN', 'SUB_ADMIN', 'DEPARTMENT_ADMIN', 'CHILD_ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING') DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastLogin DATETIME,
  createdBy INT,
  FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- University Structure
CREATE TABLE Departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  departmentId INT NOT NULL,
  totalCreditHours DECIMAL(5,2) NOT NULL,
  description TEXT,
  status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES Departments(id)
);

CREATE TABLE Courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creditHours DECIMAL(3,1) NOT NULL,
  theoryHours DECIMAL(3,1),
  labHours DECIMAL(3,1),
  courseType ENUM('THEORY', 'LAB', 'PROJECT', 'THESIS') DEFAULT 'THEORY',
  status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy INT,
  FOREIGN KEY (createdBy) REFERENCES Users(id)
);
```

### Role-Based Tables

```sql
-- Department Admin
CREATE TABLE DepartmentAdmins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT UNIQUE NOT NULL,
  departmentId INT NOT NULL,
  isHead BOOLEAN DEFAULT false,
  startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  endDate DATETIME,
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (departmentId) REFERENCES Departments(id)
);

-- Teacher
CREATE TABLE Teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT UNIQUE NOT NULL,
  employeeId VARCHAR(50) UNIQUE NOT NULL,
  departmentId INT NOT NULL,
  designation VARCHAR(100),
  joiningDate DATETIME,
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (departmentId) REFERENCES Departments(id)
);

-- Student
CREATE TABLE Students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT UNIQUE NOT NULL,
  registrationNumber VARCHAR(50) UNIQUE NOT NULL,
  batchId INT NOT NULL,
  programId INT NOT NULL,
  admissionDate DATETIME NOT NULL,
  currentSemester INT DEFAULT 1,
  cgpa DECIMAL(3,2),
  status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED', 'ON_LEAVE') DEFAULT 'ACTIVE',
  FOREIGN KEY (userId) REFERENCES Users(id),
  FOREIGN KEY (programId) REFERENCES Programs(id)
);
```

### Attendance Tables

```sql
-- Scheduling and Attendance
CREATE TABLE ClassSchedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId INT NOT NULL,
  batchId INT NOT NULL,
  sessionId INT NOT NULL,
  teacherId INT NOT NULL,
  dayOfWeek INT NOT NULL, -- 0-6 for Sunday-Saturday
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  roomNumber VARCHAR(20),
  status ENUM('ACTIVE', 'CANCELLED', 'RESCHEDULED') DEFAULT 'ACTIVE',
  FOREIGN KEY (courseId) REFERENCES Courses(id),
  FOREIGN KEY (teacherId) REFERENCES Teachers(id)
);

CREATE TABLE AttendanceRecords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scheduleId INT NOT NULL,
  studentId INT NOT NULL,
  attendanceDate DATE NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'OFFICIAL_DUTY') NOT NULL,
  markedById INT NOT NULL,
  markedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualClassDate DATE NOT NULL,
  comments TEXT,
  lastModified DATETIME,
  lastModifiedById INT,
  FOREIGN KEY (scheduleId) REFERENCES ClassSchedules(id),
  FOREIGN KEY (studentId) REFERENCES Students(id),
  FOREIGN KEY (markedById) REFERENCES Users(id),
  UNIQUE KEY (scheduleId, studentId, attendanceDate)
);
```

### OBE Tables

```sql
-- OBE Framework
CREATE TABLE ProgramLearningOutcomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  programId INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  domain ENUM('COGNITIVE', 'AFFECTIVE', 'PSYCHOMOTOR') NOT NULL,
  bloomLevel VARCHAR(50) NOT NULL,
  sdg VARCHAR(100),
  version VARCHAR(10) DEFAULT '1.0',
  status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (programId) REFERENCES Programs(id),
  UNIQUE KEY (programId, code, version)
);

CREATE TABLE CourseLearningOutcomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  domain ENUM('COGNITIVE', 'AFFECTIVE', 'PSYCHOMOTOR') NOT NULL,
  bloomLevel VARCHAR(50) NOT NULL,
  version VARCHAR(10) DEFAULT '1.0',
  status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES Courses(id),
  UNIQUE KEY (courseId, code, version)
);

CREATE TABLE CLOPLOMappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cloId INT NOT NULL,
  ploId INT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  justification TEXT,
  createdBy INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cloId) REFERENCES CourseLearningOutcomes(id),
  FOREIGN KEY (ploId) REFERENCES ProgramLearningOutcomes(id),
  FOREIGN KEY (createdBy) REFERENCES Users(id),
  UNIQUE KEY (cloId, ploId)
);
```

### Assessment Tables

```sql
-- Assessment
CREATE TABLE AssessmentTypes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  maxWeight DECIMAL(5,2),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'
);

CREATE TABLE Assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId INT NOT NULL,
  sessionId INT NOT NULL,
  typeId INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  totalMarks DECIMAL(7,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  assessmentDate DATE,
  createdBy INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES Courses(id),
  FOREIGN KEY (typeId) REFERENCES AssessmentTypes(id),
  FOREIGN KEY (createdBy) REFERENCES Users(id)
);

CREATE TABLE AssessmentCLOMappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessmentId INT NOT NULL,
  cloId INT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  createdBy INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessmentId) REFERENCES Assessments(id),
  FOREIGN KEY (cloId) REFERENCES CourseLearningOutcomes(id),
  FOREIGN KEY (createdBy) REFERENCES Users(id),
  UNIQUE KEY (assessmentId, cloId)
);

CREATE TABLE StudentMarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  assessmentId INT NOT NULL,
  obtainedMarks DECIMAL(7,2) NOT NULL,
  comments TEXT,
  enteredBy INT NOT NULL,
  enteredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastUpdatedBy INT,
  FOREIGN KEY (studentId) REFERENCES Students(id),
  FOREIGN KEY (assessmentId) REFERENCES Assessments(id),
  FOREIGN KEY (enteredBy) REFERENCES Users(id),
  FOREIGN KEY (lastUpdatedBy) REFERENCES Users(id),
  UNIQUE KEY (studentId, assessmentId)
);
```

### Results Tables

```sql
-- Results
CREATE TABLE GradingSchemes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schemeName VARCHAR(50) NOT NULL,
  applicableFrom DATE NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  createdBy INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES Users(id)
);

CREATE TABLE GradeDefinitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schemeId INT NOT NULL,
  gradeLetter VARCHAR(5) NOT NULL,
  minPercentage DECIMAL(5,2) NOT NULL,
  maxPercentage DECIMAL(5,2) NOT NULL,
  gradePoints DECIMAL(3,2) NOT NULL,
  description VARCHAR(100),
  isPass BOOLEAN DEFAULT true,
  FOREIGN KEY (schemeId) REFERENCES GradingSchemes(id),
  UNIQUE KEY (schemeId, gradeLetter)
);

CREATE TABLE StudentCLOAchievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  cloId INT NOT NULL,
  courseId INT NOT NULL,
  sessionId INT NOT NULL,
  achievementPercentage DECIMAL(5,2) NOT NULL,
  calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES Students(id),
  FOREIGN KEY (cloId) REFERENCES CourseLearningOutcomes(id),
  FOREIGN KEY (courseId) REFERENCES Courses(id),
  UNIQUE KEY (studentId, cloId, courseId, sessionId)
);

CREATE TABLE StudentPLOAttainments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  ploId INT NOT NULL,
  programId INT NOT NULL,
  attainmentPercentage DECIMAL(5,2) NOT NULL,
  calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES Students(id),
  FOREIGN KEY (ploId) REFERENCES ProgramLearningOutcomes(id),
  FOREIGN KEY (programId) REFERENCES Programs(id),
  UNIQUE KEY (studentId, ploId, programId)
);

CREATE TABLE CourseResults (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  courseId INT NOT NULL,
  sessionId INT NOT NULL,
  totalMarks DECIMAL(5,2) NOT NULL,
  gradeLetter VARCHAR(5) NOT NULL,
  gradePoints DECIMAL(3,2) NOT NULL,
  status ENUM('PASSED', 'FAILED', 'INCOMPLETE', 'WITHDRAWN') NOT NULL,
  generatedBy INT NOT NULL,
  generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES Students(id),
  FOREIGN KEY (courseId) REFERENCES Courses(id),
  FOREIGN KEY (generatedBy) REFERENCES Users(id),
  UNIQUE KEY (studentId, courseId, sessionId)
);
```

---

## User Role Hierarchy

### Role Hierarchy Diagram

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

### Role Permissions Matrix

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
| **University Structure** |
| Create Departments | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Programs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Courses | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Schedule Management** |
| Define Time Slots | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Class Schedule | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Schedule (All) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Personal Schedule | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OBE Framework** |
| Define PLOs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create CLOs | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Map CLOs to PLOs | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Attendance Management** |
| Mark Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve Leave Applications | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Submit Leave Applications | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Assessment Management** |
| Create Assessments | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Enter Student Marks | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Results Processing** |
| Calculate Course Results | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Calculate GPA/CGPA | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish Results | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **System Administration** |
| System Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Security Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Backup & Recovery | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Module Descriptions

### 1. User Management Module

**Purpose**: Manage all system users, their roles, and permissions.

**Key Features**:
- User creation (admin-driven)
- Role assignment and permission management
- User profile management
- User activation/deactivation
- Password management
- Bulk user import

**Technical Implementation**:
- RESTful API for user operations
- Secure password hashing (bcrypt)
- JWT-based authentication
- Role-based middleware

**Key Considerations**:
- Super Admin is the only role that can create Sub Admins
- Sub Admins cannot edit/delete Super Admin accounts
- Department Admins can create Child Admins but not edit other Department Admins
- Child Admins cannot create more Child Admins

### 2. University Structure Module

**Purpose**: Manage the hierarchical structure of the university.

**Key Features**:
- Department management
- Program creation and management
- Course catalog management
- Batch/section organization
- Academic calendar configuration

**Technical Implementation**:
- Hierarchical data model
- Tree-based queries for efficient structure traversal
- Caching for frequently accessed structure data

**Key Considerations**:
- Only Super/Sub Admins can create departments
- Department Admins can create programs within their departments
- Course prerequisites and co-requisites must be tracked
- Academic calendar must support multiple concurrent sessions

### 3. Class Scheduling Module

**Purpose**: Manage class schedules and room assignments.

**Key Features**:
- Time slot definition
- Room registry and capacity management
- Teacher availability tracking
- Schedule conflict detection
- Schedule visualization
- Room assignment optimization

**Technical Implementation**:
- Algorithm for schedule optimization and conflict detection
- Calendar visualization component
- Recurring schedule pattern support

**Key Considerations**:
- Schedules must be visible to all stakeholders in appropriate views
- Teachers should see only their assigned classes
- Students should see only their enrolled classes
- Schedule changes should trigger notifications

### 4. Attendance Management Module

**Purpose**: Track and manage student attendance.

**Key Features**:
- Daily attendance marking
- Flexible date attendance (with authorization)
- Bulk attendance upload
- Leave application processing
- Attendance correction workflow
- Real-time attendance statistics
- Eligibility calculation

**Technical Implementation**:
- Real-time attendance calculation
- Optimized database queries for attendance statistics
- Leave application workflow system

**Key Considerations**:
- Teachers can mark attendance for their assigned classes
- Past date attendance requires special handling
- Leave approvals affect attendance calculations
- Eligibility thresholds must be configurable by department

### 5. OBE Framework Module

**Purpose**: Manage outcome-based education framework.

**Key Features**:
- PLO definition and management
- CLO creation and mapping to PLOs
- Bloom's taxonomy level assignment
- SDG alignment tracking
- Version management for PLOs and CLOs

**Technical Implementation**:
- Weighted mapping system for CLO-PLO relationships
- Visualization tools for mapping relationships
- Versioning system for tracking changes

**Key Considerations**:
- Teachers can define CLOs for their courses
- Only Department Admins and above can define PLOs
- CLO-PLO mappings must include weight percentages
- Changes to OBE structure should maintain historical data

### 6. Assessment Management Module

**Purpose**: Create and manage student assessments.

**Key Features**:
- Assessment type configuration
- Assessment creation and CLO mapping
- Marks entry and calculation
- Grade determination
- Assessment statistics
- Bulk marks import

**Technical Implementation**:
- Formula-based calculation system
- Statistical analysis tools
- Excel-compatible import/export

**Key Considerations**:
- Assessments must be mappable to specific CLOs
- Multiple assessment components must be supported
- Weighted calculations must be accurate
- Grade boundaries must be configurable

### 7. Results Processing Module

**Purpose**: Calculate and publish student results.

**Key Features**:
- Course result calculation
- CLO achievement computation
- PLO attainment tracking
- GPA/CGPA calculation
- Transcript generation
- Result publication

**Technical Implementation**:
- Complex formulas for CLO/PLO calculations
- Statistical processing engine
- PDF generation for transcripts

**Key Considerations**:
- Only authorized users can publish results
- GPA calculation must follow university policy
- CLO achievement must consider assessment weights
- PLO attainment must consider CLO-PLO mapping weights

### 8. Analytics & Reporting Module

**Purpose**: Generate insights and reports from system data.

**Key Features**:
- Dashboard visualization
- Standard report generation
- Custom report builder
- Data export functionality
- Statistical analysis

**Technical Implementation**:
- Data visualization components
- Report generation engine
- Export functionality for multiple formats

**Key Considerations**:
- Different roles need different dashboard views
- Reports must be exportable in multiple formats
- Heavy queries should be optimized or cached
- Some reports should be schedulable

### 9. Notification Module

**Purpose**: Keep users informed of relevant events.

**Key Features**:
- Automated alerts
- Email notifications
- In-app notification center
- Notification history
- Customizable notification preferences

**Technical Implementation**:
- Event-driven notification system
- Email service integration
- Real-time notification delivery

**Key Considerations**:
- Notifications should be role-appropriate
- Critical notifications should use multiple channels
- Notification preferences should be customizable
- Notification history