#!/usr/bin/env python3
"""
SkyMentor Database Setup Script

This script creates a fresh PostgreSQL database for SkyMentor with complete schema,
enums, indexes, and seed data. It reads connection settings from environment variables.

Prerequisites:
- PostgreSQL 12+ server running
- psycopg2-binary package (pip install psycopg2-binary)
- python-dotenv package (pip install python-dotenv)
- Environment variables configured (see .env.example)

Usage:
    python db_setup.py [--drop-existing]
"""

import os
import sys
import hashlib
import uuid
from typing import Dict, List, Any
from datetime import datetime, date, time
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class DatabaseSetup:
    def __init__(self):
        """Initialize database connection from environment variables."""
        self.connection_params = {
            'host': os.getenv('PGHOST', 'localhost'),
            'port': int(os.getenv('PGPORT', 5432)),
            'database': os.getenv('PGDATABASE'),
            'user': os.getenv('PGUSER'),
            'password': os.getenv('PGPASSWORD')
        }
        
        # Validate required environment variables
        required_vars = ['PGDATABASE', 'PGUSER', 'PGPASSWORD']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
            print("Please set these in your .env file or environment.")
            sys.exit(1)
            
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection."""
        try:
            print(f"Connecting to PostgreSQL at {self.connection_params['host']}:{self.connection_params['port']}")
            self.conn = psycopg2.connect(**self.connection_params)
            self.conn.autocommit = True
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            print("✓ Database connection established")
        except psycopg2.Error as e:
            print(f"Error connecting to database: {e}")
            sys.exit(1)
            
    def disconnect(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
            
    def drop_existing_schema(self):
        """Drop all existing tables and enums (use with caution!)."""
        print("⚠️  Dropping existing schema...")
        
        # Drop tables in reverse dependency order
        tables = [
            'audit_events', 'jump_logs', 'awards', 'badges', 
            'step_completions', 'progression_steps', 'assignments',
            'attendance_requests', 'preferences', 'session_blocks',
            'availability', 'mentees', 'mentors', 'users'
        ]
        
        for table in tables:
            self.cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
            
        # Drop enums
        enums = ['role', 'status', 'comfort_level', 'category']
        for enum in enums:
            self.cursor.execute(f"DROP TYPE IF EXISTS {enum} CASCADE")
            
        print("✓ Existing schema dropped")
        
    def create_enums(self):
        """Create PostgreSQL enums."""
        print("Creating enums...")
        
        enums = {
            'role': ['mentor', 'mentee', 'admin'],
            'status': ['pending', 'confirmed', 'declined', 'cancelled'],
            'comfort_level': ['low', 'medium', 'high'],
            'category': ['2way', '3way', '4way', 'canopy', 'safety']
        }
        
        for enum_name, values in enums.items():
            values_str = "', '".join(values)
            self.cursor.execute(f"CREATE TYPE {enum_name} AS ENUM ('{values_str}')")
            
        print("✓ Enums created")
        
    def create_tables(self):
        """Create all database tables."""
        print("Creating tables...")
        
        # Users table (main account table)
        self.cursor.execute("""
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                role role NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                uspa_license TEXT,
                jumps INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Mentors table (extended profile for mentors)
        self.cursor.execute("""
            CREATE TABLE mentors (
                id UUID PRIMARY KEY REFERENCES users(id),
                ratings TEXT,
                coach_number TEXT,
                disciplines JSONB DEFAULT '[]',
                max_concurrent_mentees INTEGER DEFAULT 2,
                seniority_score INTEGER DEFAULT 0,
                dz_endorsement BOOLEAN DEFAULT false
            )
        """)
        
        # Mentees table (extended profile for mentees)
        self.cursor.execute("""
            CREATE TABLE mentees (
                id UUID PRIMARY KEY REFERENCES users(id),
                goals TEXT,
                comfort_level comfort_level DEFAULT 'medium',
                canopy_size INTEGER,
                last_currency_date DATE
            )
        """)
        
        # Availability table (when users are available)
        self.cursor.execute("""
            CREATE TABLE availability (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) NOT NULL,
                role role NOT NULL,
                day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                start_date DATE,
                end_date DATE,
                is_recurring BOOLEAN DEFAULT true,
                capacity_override INTEGER
            )
        """)
        
        # Session blocks table (training sessions created by mentors)
        self.cursor.execute("""
            CREATE TABLE session_blocks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                mentor_id UUID REFERENCES mentors(id) NOT NULL,
                date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                dz_id UUID,
                load_interval_min INTEGER DEFAULT 90,
                block_capacity_hint INTEGER DEFAULT 8
            )
        """)
        
        # Attendance requests table (mentees request to join sessions)
        self.cursor.execute("""
            CREATE TABLE attendance_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                mentee_id UUID REFERENCES mentees(id) NOT NULL,
                session_block_id UUID REFERENCES session_blocks(id) NOT NULL,
                status status DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Preferences table (mentee matching preferences)
        self.cursor.execute("""
            CREATE TABLE preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                mentee_id UUID REFERENCES mentees(id) NOT NULL,
                preferred_mentors JSONB DEFAULT '[]',
                avoid_mentors JSONB DEFAULT '[]',
                notes TEXT
            )
        """)
        
        # Assignments table (confirmed mentor-mentee pairings for sessions)
        self.cursor.execute("""
            CREATE TABLE assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_block_id UUID REFERENCES session_blocks(id) NOT NULL,
                mentor_id UUID REFERENCES mentors(id) NOT NULL,
                mentee_id UUID REFERENCES mentees(id) NOT NULL,
                status status DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Progression steps table (training milestones)
        self.cursor.execute("""
            CREATE TABLE progression_steps (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                category category NOT NULL,
                required BOOLEAN DEFAULT true,
                min_jumps_gate INTEGER DEFAULT 0,
                references JSONB
            )
        """)
        
        # Step completions table (record of completed training steps)
        self.cursor.execute("""
            CREATE TABLE step_completions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                mentee_id UUID REFERENCES mentees(id) NOT NULL,
                step_id UUID REFERENCES progression_steps(id) NOT NULL,
                mentor_id UUID REFERENCES mentors(id) NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                evidence_url TEXT,
                notes TEXT
            )
        """)
        
        # Badges table (available achievements)
        self.cursor.execute("""
            CREATE TABLE badges (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                criteria_json JSONB
            )
        """)
        
        # Awards table (earned badges)
        self.cursor.execute("""
            CREATE TABLE awards (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                mentee_id UUID REFERENCES mentees(id) NOT NULL,
                badge_id UUID REFERENCES badges(id) NOT NULL,
                awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Jump logs table (detailed jump records)
        self.cursor.execute("""
            CREATE TABLE jump_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                mentee_id UUID REFERENCES mentees(id) NOT NULL,
                date DATE NOT NULL,
                jump_number INTEGER NOT NULL,
                aircraft TEXT,
                exit_alt INTEGER,
                freefall_time INTEGER,
                deployment_alt INTEGER,
                pattern_notes TEXT,
                drill_ref TEXT,
                mentor_id UUID REFERENCES mentors(id)
            )
        """)
        
        # Audit events table (system activity tracking)
        self.cursor.execute("""
            CREATE TABLE audit_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                actor_id UUID REFERENCES users(id),
                type TEXT NOT NULL,
                payload_json JSONB,
                at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("✓ Tables created")
        
    def create_indexes(self):
        """Create database indexes for performance."""
        print("Creating indexes...")
        
        indexes = [
            "CREATE INDEX idx_users_email ON users(email)",
            "CREATE INDEX idx_users_role ON users(role)",
            "CREATE INDEX idx_availability_user_id ON availability(user_id)",
            "CREATE INDEX idx_availability_day_role ON availability(day_of_week, role)",
            "CREATE INDEX idx_session_blocks_mentor_date ON session_blocks(mentor_id, date)",
            "CREATE INDEX idx_attendance_requests_session ON attendance_requests(session_block_id)",
            "CREATE INDEX idx_assignments_session ON assignments(session_block_id)",
            "CREATE INDEX idx_assignments_mentor ON assignments(mentor_id)",
            "CREATE INDEX idx_assignments_mentee ON assignments(mentee_id)",
            "CREATE INDEX idx_step_completions_mentee ON step_completions(mentee_id)",
            "CREATE INDEX idx_step_completions_step ON step_completions(step_id)",
            "CREATE INDEX idx_progression_steps_category ON progression_steps(category)",
            "CREATE INDEX idx_awards_mentee ON awards(mentee_id)",
            "CREATE INDEX idx_jump_logs_mentee ON jump_logs(mentee_id)",
            "CREATE INDEX idx_audit_events_actor ON audit_events(actor_id)",
            "CREATE INDEX idx_audit_events_type_at ON audit_events(type, at)"
        ]
        
        for index_sql in indexes:
            self.cursor.execute(index_sql)
            
        print("✓ Indexes created")
        
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt-compatible method."""
        # Simple hash for demo - in production use bcrypt
        return hashlib.pbkdf2_hex(password.encode(), b'salt', 100000)
        
    def seed_users(self) -> Dict[str, str]:
        """Create seed user accounts and return user IDs."""
        print("Creating seed users...")
        
        users_data = [
            {
                'role': 'mentor',
                'name': 'Alex Rodriguez',
                'email': 'mentor@test.com',
                'phone': '+1-555-0101',
                'uspa_license': 'D-12345',
                'jumps': 2500,
                'password': 'password123'
            },
            {
                'role': 'mentee', 
                'name': 'Sarah Johnson',
                'email': 'mentee@test.com',
                'phone': '+1-555-0102',
                'uspa_license': 'A-67890',
                'jumps': 25,
                'password': 'password123'
            },
            {
                'role': 'admin',
                'name': 'Mike Admin', 
                'email': 'admin@test.com',
                'phone': '+1-555-0103',
                'uspa_license': 'D-54321',
                'jumps': 5000,
                'password': 'password123'
            }
        ]
        
        user_ids = {}
        
        for user_data in users_data:
            user_id = str(uuid.uuid4())
            password_hash = self.hash_password(user_data['password'])
            
            self.cursor.execute("""
                INSERT INTO users (id, role, name, email, phone, uspa_license, jumps, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, user_data['role'], user_data['name'], user_data['email'],
                user_data['phone'], user_data['uspa_license'], user_data['jumps'], password_hash
            ))
            
            user_ids[user_data['role']] = user_id
            
        print("✓ Seed users created")
        return user_ids
        
    def seed_profiles(self, user_ids: Dict[str, str]):
        """Create mentor and mentee profiles."""
        print("Creating user profiles...")
        
        # Create mentor profile
        self.cursor.execute("""
            INSERT INTO mentors (id, ratings, coach_number, disciplines, max_concurrent_mentees, seniority_score, dz_endorsement)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            user_ids['mentor'], 
            'AFF-I, Tandem, Coach',
            'C-12345',
            '["AFF", "Tandem", "Coaching"]',
            3, 85, True
        ))
        
        # Create admin as mentor too
        self.cursor.execute("""
            INSERT INTO mentors (id, ratings, coach_number, disciplines, max_concurrent_mentees, seniority_score, dz_endorsement)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            user_ids['admin'],
            'AFF-I, Tandem, Coach, Instructor Examiner',
            'IE-98765', 
            '["AFF", "Tandem", "Coaching", "Camera"]',
            5, 100, True
        ))
        
        # Create mentee profile
        self.cursor.execute("""
            INSERT INTO mentees (id, goals, comfort_level, canopy_size, last_currency_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_ids['mentee'],
            'Complete AFF program and get A-license',
            'medium',
            280,
            '2024-12-15'
        ))
        
        print("✓ User profiles created")
        
    def seed_progression_steps(self):
        """Create A-license progression curriculum."""
        print("Creating progression steps...")
        
        progression_data = [
            # 2-way formation skills (2 skills, jumps 26-30)
            ('2W-01', 'Basic 2-Way Exit', 'Learn synchronized exits with partner for stable relative work', '2way', 26),
            ('2W-02', '2-Way Sequential', 'Complete 2-point sequential moves with partner', '2way', 30),
            
            # 3-way formation skills (6 skills, jumps 35-60)
            ('3W-01', 'Star Exit', 'Master 3-way star exit from aircraft', '3way', 35),
            ('3W-02', 'Sidebody Donut', 'Build and hold sidebody donut formation', '3way', 40),
            ('3W-03', 'Open Accordion', 'Transition through open accordion formation', '3way', 45),
            ('3W-04', 'Cat to Bipole', 'Execute cat to bipole transition smoothly', '3way', 50),
            ('3W-05', '3-Way Sequential', 'Complete 3-point sequential with 2 partners', '3way', 55),
            ('3W-06', '3-Way Random', 'Complete random 3-way formations from draw', '3way', 60),
            
            # 4-way formation skills (10 skills, jumps 65-95)
            ('4W-01', 'Star to Diamond', 'Transition from star to diamond formation', '4way', 65),
            ('4W-02', 'Meeker Exit', 'Execute proper 4-way meeker exit', '4way', 68),
            ('4W-03', 'Compressed Accordion', 'Build compressed accordion with 3 partners', '4way', 71),
            ('4W-04', 'Bipole to Donut', 'Smooth transition from bipole to donut', '4way', 74),
            ('4W-05', 'Sidebody Box', 'Form and maintain sidebody box formation', '4way', 77),
            ('4W-06', 'Murphy Flake', 'Complete murphy flake with proper grips', '4way', 80),
            ('4W-07', '4-Way Sequential', 'Execute 4-point sequential moves', '4way', 83),
            ('4W-08', 'Zipper to Bow', 'Transition from zipper to bow formation', '4way', 86),
            ('4W-09', 'Block Sequence', 'Complete 2-block sequence with team', '4way', 90),
            ('4W-10', '4-Way Competition', 'Perform competition-level 4-way sequences', '4way', 95),
            
            # Canopy control skills (3 skills, jumps 30-50)
            ('CAN-01', 'Accuracy Landing', 'Land within 5 meters of target consistently', 'canopy', 30),
            ('CAN-02', 'Traffic Pattern', 'Navigate busy pattern with proper spacing', 'canopy', 40),
            ('CAN-03', 'Emergency Procedures', 'Demonstrate malfunction response procedures', 'canopy', 50),
            
            # Safety skills (3 skills, jumps 26-45)
            ('SAF-01', 'Altitude Awareness', 'Demonstrate proper altitude discipline', 'safety', 26),
            ('SAF-02', 'Collision Avoidance', 'Show effective air traffic awareness', 'safety', 35),
            ('SAF-03', 'Emergency Response', 'Execute emergency action plan correctly', 'safety', 45)
        ]
        
        for code, title, description, category, min_jumps in progression_data:
            self.cursor.execute("""
                INSERT INTO progression_steps (code, title, description, category, min_jumps_gate)
                VALUES (%s, %s, %s, %s, %s)
            """, (code, title, description, category, min_jumps))
            
        print("✓ Progression steps created")
        
    def seed_badges(self):
        """Create achievement badges."""
        print("Creating badges...")
        
        badges_data = [
            ('FIRST_2WAY', 'First 2-Way', 'Complete your first 2-way formation'),
            ('FIRST_3WAY', 'First 3-Way', 'Complete your first 3-way formation'), 
            ('FIRST_4WAY', 'First 4-Way', 'Complete your first 4-way formation'),
            ('FORMATION_MASTER', 'Formation Master', 'Complete all formation progression steps'),
            ('CANOPY_PILOT', 'Canopy Pilot', 'Master all canopy control skills'),
            ('SAFETY_CONSCIOUS', 'Safety Conscious', 'Complete all safety training'),
            ('A_LICENSE_READY', 'A-License Ready', 'Complete entire A-license curriculum'),
            ('QUICK_LEARNER', 'Quick Learner', 'Complete 5 steps in one week'),
            ('DEDICATED_STUDENT', 'Dedicated Student', 'Complete 20 jumps in training'),
            ('MENTOR_FAVORITE', 'Mentor\'s Favorite', 'Receive positive feedback from 3 different mentors')
        ]
        
        for code, name, description in badges_data:
            self.cursor.execute("""
                INSERT INTO badges (code, name, description)
                VALUES (%s, %s, %s)
            """, (code, name, description))
            
        print("✓ Badges created")
        
    def seed_sample_data(self, user_ids: Dict[str, str]):
        """Create sample sessions and assignments."""
        print("Creating sample data...")
        
        # Create sample availability
        self.cursor.execute("""
            INSERT INTO availability (user_id, role, day_of_week, start_time, end_time)
            VALUES (%s, 'mentor', 6, '08:00', '17:00')
        """, (user_ids['mentor'],))
        
        self.cursor.execute("""
            INSERT INTO availability (user_id, role, day_of_week, start_time, end_time)
            VALUES (%s, 'mentee', 6, '09:00', '16:00')
        """, (user_ids['mentee'],))
        
        # Create sample session block
        session_id = str(uuid.uuid4())
        self.cursor.execute("""
            INSERT INTO session_blocks (id, mentor_id, date, start_time, end_time)
            VALUES (%s, %s, CURRENT_DATE + 1, '10:00', '15:00')
        """, (session_id, user_ids['mentor']))
        
        # Create sample attendance request
        self.cursor.execute("""
            INSERT INTO attendance_requests (mentee_id, session_block_id, status)
            VALUES (%s, %s, 'confirmed')
        """, (user_ids['mentee'], session_id))
        
        # Create sample assignment
        self.cursor.execute("""
            INSERT INTO assignments (session_block_id, mentor_id, mentee_id, status)
            VALUES (%s, %s, %s, 'confirmed')
        """, (session_id, user_ids['mentor'], user_ids['mentee']))
        
        print("✓ Sample data created")
        
    def verify_setup(self):
        """Verify database setup was successful."""
        print("Verifying database setup...")
        
        # Check table counts
        tables = [
            'users', 'mentors', 'mentees', 'progression_steps', 
            'badges', 'availability', 'session_blocks'
        ]
        
        for table in tables:
            self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = self.cursor.fetchone()[0]
            print(f"  {table}: {count} records")
            
        # Verify progression step counts
        self.cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM progression_steps 
            WHERE category IN ('2way', '3way', '4way')
            GROUP BY category
            ORDER BY category
        """)
        
        formation_counts = self.cursor.fetchall()
        print("\nProgression breakdown:")
        for row in formation_counts:
            print(f"  {row['category']}: {row['count']} skills")
            
        print("✓ Database verification complete")
        
    def run_setup(self, drop_existing: bool = False):
        """Run complete database setup process."""
        print("🚀 SkyMentor Database Setup")
        print("=" * 40)
        
        try:
            self.connect()
            
            if drop_existing:
                self.drop_existing_schema()
                
            self.create_enums()
            self.create_tables()
            self.create_indexes()
            
            user_ids = self.seed_users()
            self.seed_profiles(user_ids)
            self.seed_progression_steps()
            self.seed_badges()
            self.seed_sample_data(user_ids)
            
            self.verify_setup()
            
            print("\n🎉 Database setup completed successfully!")
            print("\nTest accounts created:")
            print("  Mentor: mentor@test.com / password123")
            print("  Mentee: mentee@test.com / password123") 
            print("  Admin: admin@test.com / password123")
            print(f"\nDatabase: {self.connection_params['database']}")
            print(f"Host: {self.connection_params['host']}:{self.connection_params['port']}")
            
        except Exception as e:
            print(f"❌ Setup failed: {e}")
            sys.exit(1)
        finally:
            self.disconnect()

def main():
    """Main script entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Setup SkyMentor database')
    parser.add_argument('--drop-existing', action='store_true',
                       help='Drop existing schema before creating new one (DESTRUCTIVE)')
    
    args = parser.parse_args()
    
    if args.drop_existing:
        confirm = input("⚠️  This will DROP ALL EXISTING DATA. Continue? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Setup cancelled.")
            return
            
    setup = DatabaseSetup()
    setup.run_setup(drop_existing=args.drop_existing)

if __name__ == '__main__':
    main()