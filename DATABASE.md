# SkyMentor Database Documentation

## Overview

SkyMentor uses a PostgreSQL database with a comprehensive schema designed to support skydiving mentorship operations. The database manages user accounts, mentor-mentee relationships, training progression, session scheduling, and achievement tracking.

## Database Schema

### Core Entities

#### Users (`users`)
Main user table supporting three roles:
- **mentor**: Experienced skydivers who provide training and guidance
- **mentee**: Students working toward certification and skill development
- **admin**: System administrators with full access

Key fields:
- `id`: UUID primary key
- `role`: Enum (mentor, mentee, admin) 
- `name`, `email`, `phone`: Contact information
- `uspa_license`: USPA license number (e.g., "A-12345", "D-67890")
- `jumps`: Current jump count
- `password_hash`: bcrypt hashed password
- `is_active`: Account status flag

#### Role-Specific Tables

##### Mentors (`mentors`)
Extended profile for mentor users:
- `ratings`: Certifications (e.g., "AFF-I, Tandem, Coach")
- `coach_number`: Official coaching certification
- `disciplines`: JSON array of specialties ["AFF", "Tandem", "Coaching"]
- `max_concurrent_mentees`: Capacity limit (default: 2)
- `seniority_score`: Algorithm ranking factor (0-100)
- `dz_endorsement`: Drop zone endorsement status

##### Mentees (`mentees`)
Extended profile for mentee users:
- `goals`: Training objectives text
- `comfort_level`: Enum (low, medium, high)
- `canopy_size`: Parachute size in sq ft
- `last_currency_date`: Most recent jump for currency tracking

### Scheduling System

#### Availability (`availability`)
Time slots when users are available:
- `user_id`: Reference to users table
- `role`: Duplicated for query optimization
- `day_of_week`: Integer 0-6 (Sunday-Saturday)
- `start_time`/`end_time`: Time range
- `is_recurring`: Weekly repetition flag
- `start_date`/`end_date`: Date range limits

#### Session Blocks (`session_blocks`)
Mentor-created training sessions:
- `mentor_id`: Session leader
- `date`: Specific session date
- `start_time`/`end_time`: Session duration
- `dz_id`: Drop zone location (nullable)
- `load_interval_min`: Time between aircraft loads (default: 90)
- `block_capacity_hint`: Max participants (default: 8)

#### Attendance Requests (`attendance_requests`)
Mentee requests to join sessions:
- `mentee_id`: Requesting student
- `session_block_id`: Target session
- `status`: Enum (pending, confirmed, declined, cancelled)

#### Assignments (`assignments`)
Confirmed mentor-mentee pairings for sessions:
- `session_block_id`: Associated session
- `mentor_id`: Assigned instructor
- `mentee_id`: Assigned student
- `status`: Assignment status

### Progression Tracking

#### Progression Steps (`progression_steps`)
Individual training milestones:
- `code`: Unique identifier (e.g., "2W-01", "3W-05", "4W-10")
- `title`: Human-readable name
- `description`: Detailed explanation
- `category`: Enum (2way, 3way, 4way, canopy, safety)
- `min_jumps_gate`: Minimum jump count requirement
- `required`: Mandatory vs optional steps

**A-License Progression Structure:**
- **2-way skills**: 2 steps (jumps 26-30) - Basic partner formations
- **3-way skills**: 6 steps (jumps 35-60) - Three-person formations
- **4-way skills**: 10 steps (jumps 65-95) - Advanced team formations
- **Canopy skills**: 3 steps (jumps 30-50) - Parachute handling
- **Safety skills**: 3 steps (jumps 26-45) - Emergency procedures

#### Step Completions (`step_completions`)
Records of completed training steps:
- `mentee_id`: Student who completed step
- `step_id`: Reference to progression_steps
- `mentor_id`: Supervising instructor
- `completed_at`: Timestamp
- `evidence_url`: Photo/video documentation
- `notes`: Instructor feedback

### Achievement System

#### Badges (`badges`)
Available achievements:
- `code`: Unique identifier
- `name`: Display name
- `description`: Achievement description
- `criteria_json`: JSON criteria for automatic awarding

#### Awards (`awards`)
Earned badges:
- `mentee_id`: Recipient
- `badge_id`: Badge earned
- `awarded_at`: Timestamp

### Additional Features

#### Preferences (`preferences`)
Mentee matching preferences:
- `mentee_id`: Student setting preferences
- `preferred_mentors`: JSON array of preferred mentor IDs
- `avoid_mentors`: JSON array of mentors to avoid
- `notes`: Additional preferences

#### Jump Logs (`jump_logs`)
Detailed jump records:
- `mentee_id`: Jumper
- `date`: Jump date
- `jump_number`: Sequential jump count
- `aircraft`, `exit_alt`, `freefall_time`: Jump details
- `deployment_alt`: Parachute opening altitude
- `pattern_notes`: Landing pattern feedback
- `drill_ref`: Training drill reference
- `mentor_id`: Supervising mentor

#### Audit Events (`audit_events`)
System activity tracking:
- `actor_id`: User who performed action
- `type`: Action type
- `payload_json`: Action details
- `at`: Timestamp

## Enums

### role
- `mentor`: Training provider
- `mentee`: Training recipient  
- `admin`: System administrator

### status
- `pending`: Awaiting response
- `confirmed`: Accepted/approved
- `declined`: Rejected
- `cancelled`: Withdrawn

### comfort_level
- `low`: Conservative, needs extra support
- `medium`: Average confidence level
- `high`: Confident, ready for challenges

### category
- `2way`: Two-person formation skills
- `3way`: Three-person formation skills
- `4way`: Four-person formation skills
- `canopy`: Parachute handling skills
- `safety`: Emergency and safety procedures

## Indexes and Constraints

### Primary Keys
All tables use UUID primary keys with `gen_random_uuid()` default.

### Foreign Key Relationships
- `mentors.id` → `users.id`
- `mentees.id` → `users.id`
- `availability.user_id` → `users.id`
- `session_blocks.mentor_id` → `mentors.id`
- `attendance_requests.mentee_id` → `mentees.id`
- `attendance_requests.session_block_id` → `session_blocks.id`
- `assignments.mentor_id` → `mentors.id`
- `assignments.mentee_id` → `mentees.id`
- `assignments.session_block_id` → `session_blocks.id`
- `step_completions.mentee_id` → `mentees.id`
- `step_completions.step_id` → `progression_steps.id`
- `step_completions.mentor_id` → `mentors.id`
- `awards.mentee_id` → `mentees.id`
- `awards.badge_id` → `badges.id`
- `jump_logs.mentee_id` → `mentees.id`
- `jump_logs.mentor_id` → `mentors.id`
- `preferences.mentee_id` → `mentees.id`
- `audit_events.actor_id` → `users.id`

### Unique Constraints
- `users.email`: One account per email address
- `progression_steps.code`: Unique training step codes
- `badges.code`: Unique badge identifiers

## Sample Data

The system includes seed data with:
- **Test Accounts**: Pre-created users for each role
  - Mentor: mentor@test.com / password123
  - Mentee: mentee@test.com / password123  
  - Admin: admin@test.com / password123
- **Progression Steps**: Complete A-license training curriculum
- **Badges**: Achievement framework
- **Session Data**: Example training sessions and assignments

## Database Setup Requirements

### Prerequisites
- PostgreSQL 12+ with UUID extension
- Environment variables:
  - `DATABASE_URL`: Full connection string
  - `PGHOST`: Database host
  - `PGPORT`: Database port (default: 5432)
  - `PGDATABASE`: Database name
  - `PGUSER`: Database username
  - `PGPASSWORD`: Database password

### Extensions Required
- `uuid-ossp` or `pgcrypto`: For UUID generation
- Standard PostgreSQL enums and JSONB support

## Migration Strategy

The application uses Drizzle ORM with push-based migrations:
- Schema changes: Modify `shared/schema.ts`
- Deploy changes: Run `npm run db:push`
- Data seeding: Run seed script after schema deployment

This approach prioritizes development speed and works well with Drizzle's type-safe query building.