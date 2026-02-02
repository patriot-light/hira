#!/usr/bin/env python3
"""
Hira Institute Backend API Testing Suite
Tests all endpoints with proper authentication and CRUD operations
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class HiraInstituteAPITester:
    def __init__(self, base_url="https://quranica.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_resources = {
            'students': [],
            'teachers': [],
            'halaqas': [],
            'sessions': [],
            'evaluations': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, auth_required: bool = True) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {}, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            if not success:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                if response_data:
                    error_msg += f" - {response_data}"
                return False, response_data, error_msg

            return True, response_data, ""

        except requests.exceptions.RequestException as e:
            return False, {}, f"Request failed: {str(e)}"

    def test_auth_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_data = {
            "email": f"test_admin_{timestamp}@hira.edu",
            "password": "TestPass123!",
            "full_name": f"Test Admin {timestamp}",
            "role": "admin"
        }
        
        success, response, error = self.make_request(
            'POST', '/auth/register', test_data, 200, False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, error)
            return False

    def test_auth_login(self):
        """Test login with admin credentials"""
        login_data = {
            "email": "admin@hira.edu",
            "password": "admin123"
        }
        
        success, response, error = self.make_request(
            'POST', '/auth/login', login_data, 200, False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, error)
            return False

    def test_auth_me(self):
        """Test get current user"""
        success, response, error = self.make_request('GET', '/auth/me')
        
        if success and 'id' in response:
            self.log_test("Get Current User", True)
            return True
        else:
            self.log_test("Get Current User", False, error)
            return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response, error = self.make_request('GET', '/reports/dashboard')
        
        expected_fields = ['total_students', 'total_teachers', 'total_halaqas', 'total_sessions']
        if success and all(field in response for field in expected_fields):
            self.log_test("Dashboard Statistics", True)
            return True
        else:
            self.log_test("Dashboard Statistics", False, error)
            return False

    def test_students_crud(self):
        """Test Students CRUD operations"""
        # Create student
        student_data = {
            "full_name": "Ahmed Al-Hafiz",
            "age": 15,
            "national_id": "1234567890",
            "phone": "+966501234567",
            "email": "ahmed@example.com",
            "status": "active"
        }
        
        success, response, error = self.make_request('POST', '/students', student_data, 201)
        if success and 'id' in response:
            student_id = response['id']
            self.created_resources['students'].append(student_id)
            self.log_test("Create Student", True)
            
            # Get all students
            success, response, error = self.make_request('GET', '/students')
            if success and isinstance(response, list):
                self.log_test("Get All Students", True)
                
                # Get specific student
                success, response, error = self.make_request('GET', f'/students/{student_id}')
                if success and response.get('id') == student_id:
                    self.log_test("Get Student by ID", True)
                    
                    # Update student
                    update_data = student_data.copy()
                    update_data['full_name'] = "Ahmed Al-Hafiz Updated"
                    success, response, error = self.make_request('PUT', f'/students/{student_id}', update_data)
                    if success:
                        self.log_test("Update Student", True)
                    else:
                        self.log_test("Update Student", False, error)
                else:
                    self.log_test("Get Student by ID", False, error)
            else:
                self.log_test("Get All Students", False, error)
        else:
            self.log_test("Create Student", False, error)

    def test_teachers_crud(self):
        """Test Teachers CRUD operations"""
        teacher_data = {
            "full_name": "Dr. Mohammad Al-Qari",
            "qualification": "PhD in Quranic Studies",
            "experience_years": 10,
            "phone": "+966501234568",
            "email": "mohammad@hira.edu"
        }
        
        success, response, error = self.make_request('POST', '/teachers', teacher_data, 201)
        if success and 'id' in response:
            teacher_id = response['id']
            self.created_resources['teachers'].append(teacher_id)
            self.log_test("Create Teacher", True)
            
            # Get all teachers
            success, response, error = self.make_request('GET', '/teachers')
            if success and isinstance(response, list):
                self.log_test("Get All Teachers", True)
                
                # Get specific teacher
                success, response, error = self.make_request('GET', f'/teachers/{teacher_id}')
                if success and response.get('id') == teacher_id:
                    self.log_test("Get Teacher by ID", True)
                else:
                    self.log_test("Get Teacher by ID", False, error)
            else:
                self.log_test("Get All Teachers", False, error)
        else:
            self.log_test("Create Teacher", False, error)

    def test_halaqas_crud(self):
        """Test Halaqas CRUD operations"""
        halaqa_data = {
            "name": "Halaqa Al-Fajr",
            "level": "intermediate",
            "teacher_ids": self.created_resources['teachers'][:1] if self.created_resources['teachers'] else [],
            "schedule": [
                {
                    "day": "sunday",
                    "start_time": "06:00",
                    "end_time": "07:30"
                }
            ]
        }
        
        success, response, error = self.make_request('POST', '/halaqas', halaqa_data, 201)
        if success and 'id' in response:
            halaqa_id = response['id']
            self.created_resources['halaqas'].append(halaqa_id)
            self.log_test("Create Halaqa", True)
            
            # Get all halaqas
            success, response, error = self.make_request('GET', '/halaqas')
            if success and isinstance(response, list):
                self.log_test("Get All Halaqas", True)
                
                # Get specific halaqa
                success, response, error = self.make_request('GET', f'/halaqas/{halaqa_id}')
                if success and response.get('id') == halaqa_id:
                    self.log_test("Get Halaqa by ID", True)
                else:
                    self.log_test("Get Halaqa by ID", False, error)
            else:
                self.log_test("Get All Halaqas", False, error)
        else:
            self.log_test("Create Halaqa", False, error)

    def test_page_evaluations(self):
        """Test Page Evaluations"""
        if not self.created_resources['students']:
            self.log_test("Page Evaluations", False, "No students available for testing")
            return
            
        eval_data = {
            "student_id": self.created_resources['students'][0],
            "page_number": 1,
            "score": 85.5,
            "notes": "Good recitation with minor pronunciation issues"
        }
        
        success, response, error = self.make_request('POST', '/evaluations/pages', eval_data, 201)
        if success and 'id' in response:
            eval_id = response['id']
            self.created_resources['evaluations'].append(eval_id)
            self.log_test("Create Page Evaluation", True)
            
            # Get evaluations
            success, response, error = self.make_request('GET', '/evaluations/pages')
            if success and isinstance(response, list):
                self.log_test("Get Page Evaluations", True)
            else:
                self.log_test("Get Page Evaluations", False, error)
        else:
            self.log_test("Create Page Evaluation", False, error)

    def test_juz_evaluations(self):
        """Test Juz Evaluations"""
        if not self.created_resources['students']:
            self.log_test("Juz Evaluations", False, "No students available for testing")
            return
            
        eval_data = {
            "student_id": self.created_resources['students'][0],
            "juz_number": 1,
            "memorization_score": 90.0,
            "mastery_score": 85.0,
            "notes": "Excellent memorization, needs work on tajweed"
        }
        
        success, response, error = self.make_request('POST', '/evaluations/juz', eval_data, 201)
        if success and 'id' in response:
            self.log_test("Create Juz Evaluation", True)
            
            # Get evaluations
            success, response, error = self.make_request('GET', '/evaluations/juz')
            if success and isinstance(response, list):
                self.log_test("Get Juz Evaluations", True)
            else:
                self.log_test("Get Juz Evaluations", False, error)
        else:
            self.log_test("Create Juz Evaluation", False, error)

    def test_recitation_sessions(self):
        """Test Recitation Sessions"""
        if not self.created_resources['students'] or not self.created_resources['teachers']:
            self.log_test("Recitation Sessions", False, "No students/teachers available for testing")
            return
            
        session_data = {
            "student_id": self.created_resources['students'][0],
            "teacher_id": self.created_resources['teachers'][0],
            "duration_minutes": 30,
            "from_page": 1,
            "to_page": 5,
            "errors": [
                {
                    "category": "makharij",
                    "description": "Incorrect pronunciation of 'ق'",
                    "page_number": 2,
                    "word": "قُلْ",
                    "penalty": 1.0
                }
            ]
        }
        
        success, response, error = self.make_request('POST', '/sessions', session_data, 201)
        if success and 'id' in response:
            session_id = response['id']
            self.created_resources['sessions'].append(session_id)
            self.log_test("Create Recitation Session", True)
            
            # Get sessions
            success, response, error = self.make_request('GET', '/sessions')
            if success and isinstance(response, list):
                self.log_test("Get Recitation Sessions", True)
                
                # Get specific session
                success, response, error = self.make_request('GET', f'/sessions/{session_id}')
                if success and response.get('id') == session_id:
                    self.log_test("Get Session by ID", True)
                else:
                    self.log_test("Get Session by ID", False, error)
            else:
                self.log_test("Get Recitation Sessions", False, error)
        else:
            self.log_test("Create Recitation Session", False, error)

    def test_reports(self):
        """Test Reports endpoints"""
        # Student report
        if self.created_resources['students']:
            student_id = self.created_resources['students'][0]
            success, response, error = self.make_request('GET', f'/reports/student/{student_id}')
            if success and 'student' in response:
                self.log_test("Student Report", True)
            else:
                self.log_test("Student Report", False, error)

        # Halaqa report
        if self.created_resources['halaqas']:
            halaqa_id = self.created_resources['halaqas'][0]
            success, response, error = self.make_request('GET', f'/reports/halaqa/{halaqa_id}')
            if success and 'halaqa' in response:
                self.log_test("Halaqa Report", True)
            else:
                self.log_test("Halaqa Report", False, error)

        # Teacher report
        if self.created_resources['teachers']:
            teacher_id = self.created_resources['teachers'][0]
            success, response, error = self.make_request('GET', f'/reports/teacher/{teacher_id}')
            if success and 'teacher' in response:
                self.log_test("Teacher Report", True)
            else:
                self.log_test("Teacher Report", False, error)

    def test_export_functionality(self):
        """Test Export endpoints"""
        # Test Excel export
        success, response, error = self.make_request('GET', '/export/students/excel')
        if success:
            self.log_test("Export Students Excel", True)
        else:
            self.log_test("Export Students Excel", False, error)

        # Test PDF export
        success, response, error = self.make_request('GET', '/export/students/pdf')
        if success:
            self.log_test("Export Students PDF", True)
        else:
            self.log_test("Export Students PDF", False, error)

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete sessions
        for session_id in self.created_resources['sessions']:
            self.make_request('DELETE', f'/sessions/{session_id}', expected_status=200)
        
        # Delete evaluations
        for eval_id in self.created_resources['evaluations']:
            self.make_request('DELETE', f'/evaluations/pages/{eval_id}', expected_status=200)
        
        # Delete students
        for student_id in self.created_resources['students']:
            self.make_request('DELETE', f'/students/{student_id}', expected_status=200)
        
        # Delete halaqas
        for halaqa_id in self.created_resources['halaqas']:
            self.make_request('DELETE', f'/halaqas/{halaqa_id}', expected_status=200)
        
        # Delete teachers
        for teacher_id in self.created_resources['teachers']:
            self.make_request('DELETE', f'/teachers/{teacher_id}', expected_status=200)

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Hira Institute API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Authentication tests
        if not self.test_auth_login():
            print("❌ Authentication failed - stopping tests")
            return False

        self.test_auth_me()
        self.test_dashboard_stats()

        # CRUD operations
        self.test_students_crud()
        self.test_teachers_crud()
        self.test_halaqas_crud()

        # Evaluations and sessions
        self.test_page_evaluations()
        self.test_juz_evaluations()
        self.test_recitation_sessions()

        # Reports
        self.test_reports()

        # Export functionality
        self.test_export_functionality()

        # Cleanup
        self.cleanup_resources()

        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = HiraInstituteAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())