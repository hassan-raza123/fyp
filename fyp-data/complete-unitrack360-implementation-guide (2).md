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
│ ┌───────┬───────────┬─────────────┬───────────┬─────────────┐   │
│ │ Time  │ Course    │ Teacher     │ Room      │ Status      │   │
│ ├───────┼───────────┼─────────────┼───────────┼─────────────┤   │
│ │ 08:30 │ CS303     │ Dr. Ahmed   │ CS-Lab-2  │ Completed   │   │
│ │ 10:30 │ MTH201    │ Ms. Fatima  │ LH-204    │ In Progress │   │
│ │ 13:30 │ PHY101    │ Dr. Kamran  │ PHY-Lab   │ Upcoming    │   │
│ └───────┴───────────┴─────────────┴───────────┴─────────────┘   │
│                                                                 │
│ CLO ACHIEVEMENT PROGRESS                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │       [Bar chart showing CLO achievement percentages]       │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 5. OBE Configuration Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ OBE Framework > PLO Management            User: [Dept Admin] ▼   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ PROGRAM SELECTION                                               │
│ ┌───────────────────────────────────┐                           │
│ │ Program: BS Computer Science (CS) ▼│                           │
│ └───────────────────────────────────┘                           │
│                                                                 │
│ PROGRAM LEARNING OUTCOMES (PLOs)                                │
│ ┌─────┬────────┬────────────────────────┬───────┬──────┬───────┐│
│ │ ID  │ Code   │ Description            │ Domain │ Bloom │ SDG  ││
│ ├─────┼────────┼────────────────────────┼───────┼──────┼───────┤│
│ │ 1   │ PLO-1  │ Apply knowledge of com-│ Cogni- │ Apply │ SDG4 ││
│ │     │        │ puting fundamentals... │ tive   │       │       ││
│ ├─────┼────────┼────────────────────────┼───────┼──────┼───────┤│
│ │ 2   │ PLO-2  │ Analyze and solve com- │ Cogni- │ Anal- │ SDG9 ││
│ │     │        │ plex computing prob... │ tive   │ yze   │       ││
│ ├─────┼────────┼────────────────────────┼───────┼──────┼───────┤│
│ │ 3   │ PLO-3  │ Design, implement, and │ Cogni- │ Create│ SDG9 ││
│ │     │        │ evaluate computer-ba...│ tive   │       │       ││
│ └─────┴────────┴────────────────────────┴───────┴──────┴───────┘│
│                                                                 │
│ ACTIONS                                                         │
│ ┌─────────────┐  ┌──────────────┐  ┌────────────────┐          │
│ │ Create PLO  │  │ Edit Selected │  │ Archive Selected │        │
│ └─────────────┘  └──────────────┘  └────────────────┘          │
│                                                                 │
│ PLO ATTAINMENT SUMMARY                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │      [Radar chart showing PLO attainment by batch]          │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 6. Assessment Management Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Assessment > Create Assessment           User: [Teacher] ▼       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ASSESSMENT DETAILS                                              │
│ ┌─────────────────────┐  ┌────────────────────┐                 │
│ │ Course: CS303      ▼│  │ Type: Quiz        ▼│                 │
│ └─────────────────────┘  └────────────────────┘                 │
│                                                                 │
│ ┌─────────────────────┐  ┌────────────────────┐                 │
│ │ Title: [Quiz 3 - Arrays and Pointers]       │                 │
│ └─────────────────────────────────────────────┘                 │
│                                                                 │
│ ┌─────────────────────┐  ┌────────────────────┐                 │
│ │ Total Marks: [20]   │  │ Weight (%): [10]   │                 │
│ └─────────────────────┘  └────────────────────┘                 │
│                                                                 │
│ ┌─────────────────────────────────────────────┐                 │
│ │ Date: [2023-10-15]                          │                 │
│ └─────────────────────────────────────────────┘                 │
│                                                                 │
│ CLO MAPPING                                                     │
│ ┌─────┬────────────────────────────────────┬─────────┬─────────┐│
│ │ CLO │ Description                        │ Mapped  │ Weight %││
│ ├─────┼────────────────────────────────────┼─────────┼─────────┤│
│ │ 1   │ Demonstrate understanding of array │ ☑       │ [60]    ││
│ │     │ data structures                    │         │         ││
│ ├─────┼────────────────────────────────────┼─────────┼─────────┤│
│ │ 2   │ Apply pointer concepts to solve    │ ☑       │ [40]    ││
│ │     │ programming problems               │         │         ││
│ ├─────┼────────────────────────────────────┼─────────┼─────────┤│
│ │ 3   │ Implement dynamic memory allocation│ ☐       │ [0]     ││
│ │     │ techniques                         │         │         ││
│ └─────┴────────────────────────────────────┴─────────┴─────────┘│
│                                                                 │
│ ACTIONS                                                         │
│ ┌────────────┐  ┌────────────┐  ┌────────────────────────┐     │
│ │ Save Draft │  │ Clear Form │  │ Create Assessment      │     │
│ └────────────┘  └────────────┘  └────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

#### 7. Results Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Results > Semester Results              User: [Dept Admin] ▼     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ RESULT PARAMETERS                                               │
│ ┌───────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│ │ Program: BSCS    ▼│  │ Batch: FA-2023▼│  │ Semester: 3   ▼│   │
│ └───────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                 │
│ SEMESTER RESULTS                                                │
│ ┌──────┬───────────────┬───────┬───────┬───────┬───────┬───────┐│
│ │ Reg# │ Student Name  │ CS303 │ MTH201│ PHY101│ GPA   │ Status││
│ ├──────┼───────────────┼───────┼───────┼───────┼───────┼───────┤│
│ │ S001 │ Ali Ahmed     │ A     │ B+    │ B     │ 3.67  │ Pass  ││
│ │ S002 │ Sara Khan     │ A     │ A-    │ B+    │ 3.83  │ Pass  ││
│ │ S003 │ Umar Malik    │ B+    │ B     │ C+    │ 2.83  │ Pass  ││
│ │ S004 │ Ayesha Ali    │ A     │ A     │ A-    │ 3.92  │ Pass  ││
│ └──────┴───────────────┴───────┴───────┴───────┴───────┴───────┘│
│                                                                 │
│ CLASS STATISTICS                                                │
│ ┌───────────────────────────────────────┐                       │
│ │ Class Average GPA: 3.56               │                       │
│ │ Highest GPA: 3.92 (Ayesha Ali)        │                       │
│ │ Pass Rate: 100%                       │                       │
│ └───────────────────────────────────────┘                       │
│                                                                 │
│ GRADE DISTRIBUTION                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │         [Bar chart showing grade distribution]              │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ACTIONS                                                         │
│ ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│ │ Export Excel │  │ Export PDF   │  │ Publish Results    │     │
│ └──────────────┘  └──────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/login             # Authenticate user
POST   /api/auth/logout            # End session
POST   /api/auth/reset-password    # Reset password
GET    /api/auth/profile           # Get user profile
PUT    /api/auth/profile           # Update user profile
```

### User Management Endpoints

```
GET    /api/users                  # List users
POST   /api/users                  # Create user
GET    /api/users/:id              # Get user details
PUT    /api/users/:id              # Update user
DELETE /api/users/:id              # Deactivate user
POST   /api/users/bulk-import      # Import multiple users

GET    /api/roles                  # List roles
POST   /api/roles                  # Create role
GET    /api/roles/:id              # Get role details
PUT    /api/roles/:id              # Update role
DELETE /api/roles/:id              # Delete role
```

### University Structure Endpoints

```
GET    /api/departments            # List departments
POST   /api/departments            # Create department
GET    /api/departments/:id        # Get department details
PUT    /api/departments/:id        # Update department
DELETE /api/departments/:id        # Delete department

GET    /api/programs               # List programs
POST   /api/programs               # Create program
GET    /api/programs/:id           # Get program details
PUT    /api/programs/:id           # Update program
DELETE /api/programs/:id           # Delete program

GET    /api/courses                # List courses
POST   /api/courses                # Create course
GET    /api/courses/:id            # Get course details
PUT    /api/courses/:id            # Update course
DELETE /api/courses/:id            # Delete course

GET    /api/batches                # List batches
POST   /api/batches                # Create batch
GET    /api/batches/:id            # Get batch details
PUT    /api/batches/:id            # Update batch
DELETE /api/batches/:id            # Delete batch
```

### Scheduling Endpoints

```
GET    /api/schedules              # List schedules
POST   /api/schedules              # Create schedule
GET    /api/schedules/:id          # Get schedule details
PUT    /api/schedules/:id          # Update schedule
DELETE /api/schedules/:id          # Delete schedule

GET    /api/schedules/teacher/:id  # Get teacher's schedule
GET    /api/schedules/student/:id  # Get student's schedule
GET    /api/schedules/room/:id     # Get room's schedule
GET    /api/schedules/course/:id   # Get course's schedule

POST   /api/schedules/conflicts    # Check for schedule conflicts
```

### Attendance Endpoints

```
GET    /api/attendance             # List attendance records
POST   /api/attendance             # Mark attendance
GET    /api/attendance/:id         # Get attendance details
PUT    /api/attendance/:id         # Update attendance
DELETE /api/attendance/:id         # Delete attendance

POST   /api/attendance/bulk-mark   # Mark attendance for multiple students
GET    /api/attendance/student/:id # Get student's attendance
GET    /api/attendance/course/:id  # Get course's attendance
GET    /api/attendance/teacher/:id # Get teacher's marked attendance

GET    /api/leaves                 # List leave applications
POST   /api/leaves                 # Submit leave application
GET    /api/leaves/:id             # Get leave details
PUT    /api/leaves/:id             # Update leave application
DELETE /api/leaves/:id             # Delete leave application
```

### OBE Framework Endpoints

```
GET    /api/plos                   # List PLOs
POST   /api/plos                   # Create PLO
GET    /api/plos/:id               # Get PLO details
PUT    /api/plos/:id               # Update PLO
DELETE /api/plos/:id               # Delete PLO

GET    /api/clos                   # List CLOs
POST   /api/clos                   # Create CLO
GET    /api/clos/:id               # Get CLO details
PUT    /api/clos/:id               # Update CLO
DELETE /api/clos/:id               # Delete CLO

GET    /api/clo-plo-mappings       # List CLO-PLO mappings
POST   /api/clo-plo-mappings       # Create CLO-PLO mapping
GET    /api/clo-plo-mappings/:id   # Get mapping details
PUT    /api/clo-plo-mappings/:id   # Update mapping
DELETE /api/clo-plo-mappings/:id   # Delete mapping
```

### Assessment Endpoints

```
GET    /api/assessments            # List assessments
POST   /api/assessments            # Create assessment
GET    /api/assessments/:id        # Get assessment details
PUT    /api/assessments/:id        # Update assessment
DELETE /api/assessments/:id        # Delete assessment

GET    /api/assessment-types       # List assessment types
POST   /api/assessment-types       # Create assessment type
GET    /api/assessment-types/:id   # Get assessment type
PUT    /api/assessment-types/:id   # Update assessment type
DELETE /api/assessment-types/:id   # Delete assessment type

GET    /api/student-marks          # List student marks
POST   /api/student-marks          # Enter student marks
GET    /api/student-marks/:id      # Get mark details
PUT    /api/student-marks/:id      # Update marks
DELETE /api/student-marks/:id      # Delete marks
```

### Results Endpoints

```
GET    /api/course-results         # List course results
POST   /api/course-results/calculate # Calculate course results
GET    /api/course-results/:id     # Get course result details
PUT    /api/course-results/:id     # Update course result

GET    /api/semester-results       # List semester results
POST   /api/semester-results/calculate # Calculate semester results
GET    /api/semester-results/:id   # Get semester result details
PUT    /api/semester-results/:id   # Update semester result

GET    /api/clo-achievements       # List CLO achievements
GET    /api/clo-achievements/student/:id # Get student CLO achievements
GET    /api/clo-achievements/course/:id # Get course CLO achievements

GET    /api/plo-attainments        # List PLO attainments
GET    /api/plo-attainments/student/:id # Get student PLO attainments 
GET    /api/plo-attainments/program/:id # Get program PLO attainments
```

### Report Endpoints

```
GET    /api/reports/attendance     # Generate attendance reports
GET    /api/reports/results        # Generate result reports
GET    /api/reports/obe            # Generate OBE reports
GET    /api/reports/transcripts    # Generate transcripts
GET    /api/reports/custom         # Generate custom reports
```

---

## Implementation Plan

### Phase 1: Foundation (Weeks 1-4)
- Set up development environment and version control
- Implement database schema and migrations
- Create basic user authentication system
- Implement role-based authorization
- Develop core user management functionality
- Create university structure management system

**Key Deliverables:**
- Working authentication system
- Role hierarchy implementation
- User management interface
- Basic university structure management

### Phase 2: University Structure & Scheduling (Weeks 5-8)
- Implement department and program management
- Develop course catalog system
- Create academic calendar functionality
- Build class scheduling system
- Implement room management
- Develop schedule conflict detection

**Key Deliverables:**
- Complete university structure management
- Functional class scheduling system
- Schedule visualization interfaces
- Schedule conflict resolution tools

### Phase 3: Attendance System (Weeks 9-12)
- Implement attendance marking interfaces
- Develop flexible date attendance system
- Create leave application workflow
- Build attendance reporting tools
- Implement attendance statistics calculation
- Develop eligibility tracking

**Key Deliverables:**
- Complete attendance marking system
- Leave management functionality
- Attendance statistics and reporting
- Mobile attendance support

### Phase 4: OBE Framework (Weeks 13-16)
- Implement PLO management system
- Develop CLO creation and management
- Build CLO-PLO mapping functionality
- Create Bloom's taxonomy integration
- Implement SDG alignment tracking
- Develop OBE visualization tools

**Key Deliverables:**
- Complete OBE framework management
- CLO-PLO mapping interfaces
- OBE visualization dashboards
- Version management for CLOs/PLOs

### Phase 5: Assessment Management (Weeks 17-20)
- Implement assessment type configuration
- Develop assessment creation interface
- Build assessment-CLO mapping system
- Create marks entry interfaces
- Implement bulk marks import
- Develop assessment statistics

**Key Deliverables:**
- Complete assessment management system
- Marks entry and calculation functionality
- Assessment-CLO mapping tools
- Assessment statistics reporting

### Phase 6: Results Processing (Weeks 21-24)
- Implement course result calculation
- Develop CLO achievement computation
- Build PLO attainment tracking
- Create GPA/CGPA calculation system
- Implement transcript generation
- Develop result publication functionality

**Key Deliverables:**
- Complete result processing system
- CLO/PLO achievement tracking
- GPA/CGPA calculation
- Transcript generation

### Phase 7: Analytics & Reports (Weeks 25-28)
- Implement dashboard visualizations
- Develop standard report templates
- Build custom report builder
- Create data export functionality
- Implement statistical analysis tools
- Develop notification system

**Key Deliverables:**
- Comprehensive analytics dashboards
- Standard and custom reports
- Export functionality
- Notification system

### Phase 8: Testing & Refinement (Weeks 29-32)
- Conduct comprehensive testing
- Fix identified issues
- Optimize performance
- Refine user interfaces
- Prepare documentation
- Train administrators

**Key Deliverables:**
- Tested, production-ready system
- User documentation
- Administrator training materials
- System optimization

---

## Testing Strategy

### Testing Levels

#### Unit Testing
- Test individual components and methods
- Ensure correct calculation of formulas
- Verify proper data validation
- Check error handling

**Tools:** Jest, React Testing Library

#### Integration Testing
- Test API endpoints
- Verify database interactions
- Validate authentication and authorization
- Test module interactions

**Tools:** Supertest, Postman

#### System Testing
- Test end-to-end workflows
- Verify business requirements
- Test from user perspective
- Validate system integration

**Tools:** Cypress, Selenium

#### Performance Testing
- Test system under load
- Verify response times
- Test concurrent user handling
- Identify bottlenecks

**Tools:** JMeter, LoadRunner

### Test Cases (Selected Examples)

#### Authentication Test Cases
1. Valid login credentials should authenticate user
2. Invalid credentials should show appropriate error
3. Password reset functionality should work correctly
4. Session timeout should require re-authentication
5. Users should only access authorized features

#### Attendance Test Cases
1. Teacher should be able to mark attendance
2. Past date attendance should require approval
3. Leave applications should affect attendance calculation
4. Attendance statistics should be calculated correctly
5. Eligibility should be determined based on attendance

#### OBE Test Cases
1. CLOs should be mappable to PLOs with weights
2. Assessment marks should calculate CLO achievement correctly
3. CLO achievements should roll up to PLO attainments
4. OBE reports should show correct achievement data
5. Version changes should maintain historical data

#### Results Test Cases
1. Course results should be calculated correctly
2. GPA calculation should follow university policy
3. CGPA should be updated with new semester results
4. Transcripts should include all required information
5. Result publication workflow should work correctly

---

This comprehensive implementation guide provides detailed information for developing the UniTrack360 system. It covers all aspects from system architecture to database design, user interfaces, API endpoints, and implementation timeline. Developers can use this guide to build the system according to the requirements while ensuring all user roles and workflows are properly implemented.

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