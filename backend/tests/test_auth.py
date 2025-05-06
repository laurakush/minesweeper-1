import unittest
import json
from app import create_app
from config import TestingConfig
from models import db, User
from flask_bcrypt import Bcrypt

class AuthTestCase(unittest.TestCase):
    """Test case for authentication endpoints."""

    def setUp(self):
        """Set up the test environment."""
        self.app = create_app(TestingConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()
        db.create_all()
        self.bcrypt = Bcrypt(self.app)

        # Create a test user
        hashed_password = self.bcrypt.generate_password_hash("testpassword").decode("utf-8")
        self.test_user = User(
            username="existinguser",
            password=hashed_password,
            email="existing@example.com"
        )
        db.session.add(self.test_user)
        db.session.commit()

    def tearDown(self):
        """Clean up the test environment."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_user_registration(self):
        """Test user registration endpoint."""
        # Test successful registration
        response = self.client.post(
            "/api/register",
            data=json.dumps({
                "username": "newuser",
                "password": "password123",
                "email": "new@example.com"
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode())
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["username"], "newuser")

        # Test registration with existing username
        response = self.client.post(
            "/api/register",
            data=json.dumps({
                "username": "existinguser",
                "password": "password123",
                "email": "another@example.com"
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 409)  # Conflict
        data = json.loads(response.data.decode())
        self.assertIn("error", data)
        self.assertIn("Username already exists", data["error"])

    def test_user_login(self):
        """Test user login endpoint."""
        # Test successful login
        response = self.client.post(
            "/api/login",
            data=json.dumps({
                "username": "existinguser",
                "password": "testpassword"
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode())
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["username"], "existinguser")

        # Test login with incorrect password
        response = self.client.post(
            "/api/login",
            data=json.dumps({
                "username": "existinguser",
                "password": "wrongpassword"
            }),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)  # Unauthorized
        data = json.loads(response.data.decode())
        self.assertIn("error", data)
        self.assertIn("Invalid username or password", data["error"])

    def test_get_user_profile(self):
        """Test getting user profile with JWT authentication."""
        # Login to get token
        login_response = self.client.post(
            "/api/login",
            data=json.dumps({
                "username": "existinguser",
                "password": "testpassword"
            }),
            content_type="application/json"
        )
        login_data = json.loads(login_response.data.decode())
        access_token = login_data["access_token"]

        # Get user profile with token
        response = self.client.get(
            "/api/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode())
        self.assertEqual(data["user"]["username"], "existinguser")

        # Test unauthorized access
        response = self.client.get("/api/user")
        self.assertEqual(response.status_code, 401)  # Unauthorized