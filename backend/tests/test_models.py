import unittest
from datetime import datetime
from app import create_app
from models import db, User, GameStats
from flask_bcrypt import Bcrypt

class ModelsTestCase(unittest.TestCase):
    """Test case for the app models."""

    def setUp(self):
        """Set up the test environment."""
        self.app = create_app("testing")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()
        db.create_all()
        self.bcrypt = Bcrypt(self.app)

    def tearDown(self):
        """Clean up the test environment."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_user_model(self):
        """Test User model creation and relationships."""
        # Create a test user
        hashed_password = self.bcrypt.generate_password_hash("testpassword").decode("utf-8")
        user = User(username="testuser", password=hashed_password, email="test@example.com")
        db.session.add(user)
        db.session.commit()

        # Retrieve the user and verify
        retrieved_user = User.query.filter_by(username="testuser").first()
        self.assertIsNotNone(retrieved_user)
        self.assertEqual(retrieved_user.username, "testuser")
        self.assertEqual(retrieved_user.email, "test@example.com")
        self.assertTrue(self.bcrypt.check_password_hash(retrieved_user.password, "testpassword"))

    def test_user_to_dict(self):
        """Test User model to_dict method."""
        user = User(username="testuser", password="hashed_pwd", email="test@example.com")
        db.session.add(user)
        db.session.commit()

        user_dict = user.to_dict()
        self.assertEqual(user_dict["username"], "testuser")
        self.assertEqual(user_dict["email"], "test@example.com")
        self.assertIn("id", user_dict)
        self.assertIn("created_at", user_dict)
        self.assertNotIn("password", user_dict)  # Password should not be included

    def test_game_stats_model(self):
        """Test GameStats model creation and relationships."""
        # Create a test user first
        user = User(username="gameuser", password="testpass", email="game@example.com")
        db.session.add(user)
        db.session.commit()

        # Create game stats associated with the user
        game_stats = GameStats(
            user_id=user.id,
            difficulty="MEDIUM",
            time_taken=120,
            is_win=True,
            mines_flagged=10,
            cells_opened=40
        )
        db.session.add(game_stats)
        db.session.commit()

        # Retrieve and verify
        retrieved_stats = GameStats.query.filter_by(user_id=user.id).first()
        self.assertIsNotNone(retrieved_stats)
        self.assertEqual(retrieved_stats.difficulty, "MEDIUM")
        self.assertEqual(retrieved_stats.time_taken, 120)
        self.assertTrue(retrieved_stats.is_win)
        self.assertEqual(retrieved_stats.mines_flagged, 10)
        self.assertEqual(retrieved_stats.cells_opened, 40)

        # Verify relationship
        self.assertEqual(retrieved_stats.user.username, "gameuser")

    def test_game_stats_to_dict(self):
        """Test GameStats model to_dict method."""
        user = User(username="statuser", password="testpass", email="stats@example.com")
        db.session.add(user)
        db.session.commit()

        game_stats = GameStats(
            user_id=user.id,
            difficulty="EASY",
            time_taken=60,
            is_win=False,
            mines_flagged=5,
            cells_opened=20
        )
        db.session.add(game_stats)
        db.session.commit()

        stats_dict = game_stats.to_dict()
        self.assertEqual(stats_dict["difficulty"], "EASY")
        self.assertEqual(stats_dict["time_taken"], 60)
        self.assertFalse(stats_dict["is_win"])
        self.assertEqual(stats_dict["mines_flagged"], 5)
        self.assertEqual(stats_dict["cells_opened"], 20)
        self.assertEqual(stats_dict["user_id"], user.id)
        self.assertIn("played_at", stats_dict)

# backend/tests/test_auth.py
import unittest
import json
from app import create_app
from models import db, User
from flask_bcrypt import Bcrypt

class AuthTestCase(unittest.TestCase):
    """Test case for authentication endpoints."""

    def setUp(self):
        """Set up the test environment."""
        self.app = create_app("testing")
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

# backend/tests/test_game_stats.py
import unittest
import json
from app import create_app
from models import db, User, GameStats
from flask_bcrypt import Bcrypt

class GameStatsTestCase(unittest.TestCase):
    """Test case for game stats endpoints."""

    def setUp(self):
        """Set up the test environment."""
        self.app = create_app("testing")
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.client = self.app.test_client()
        db.create_all()
        self.bcrypt = Bcrypt(self.app)

        # Create a test user
        hashed_password = self.bcrypt.generate_password_hash("testpassword").decode("utf-8")
        self.test_user = User(
            username="gameuser",
            password=hashed_password,
            email="game@example.com"
        )
        db.session.add(self.test_user)
        db.session.commit()

        # Add some game stats for the user
        game_stats1 = GameStats(
            user_id=self.test_user.id,
            difficulty="EASY",
            time_taken=45,
            is_win=True,
            mines_flagged=10,
            cells_opened=71
        )
        game_stats2 = GameStats(
            user_id=self.test_user.id,
            difficulty="MEDIUM",
            time_taken=120,
            is_win=False,
            mines_flagged=20,
            cells_opened=100
        )
        db.session.add_all([game_stats1, game_stats2])
        db.session.commit()

        # Login to get token
        login_response = self.client.post(
            "/api/login",
            data=json.dumps({
                "username": "gameuser",
                "password": "testpassword"
            }),
            content_type="application/json"
        )
        login_data = json.loads(login_response.data.decode())
        self.access_token = login_data["access_token"]

    def tearDown(self):
        """Clean up the test environment."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_save_game_stats(self):
        """Test saving game stats endpoint."""
        # Test successful saving of game stats
        response = self.client.post(
            "/api/game-stats",
            data=json.dumps({
                "difficulty": "HARD",
                "time_taken": 180,
                "is_win": True,
                "mines_flagged": 30,
                "cells_opened": 150
            }),
            headers={"Authorization": f"Bearer {self.access_token}"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data.decode())
        self.assertIn("game_stats", data)
        self.assertEqual(data["game_stats"]["difficulty"], "HARD")
        self.assertEqual(data["game_stats"]["time_taken"], 180)
        self.assertTrue(data["game_stats"]["is_win"])

        # Test saving with missing required fields
        response = self.client.post(
            "/api/game-stats",
            data=json.dumps({
                "difficulty": "MEDIUM"
                # Missing time_taken and is_win
            }),
            headers={"Authorization": f"Bearer {self.access_token}"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode())
        self.assertIn("error", data)

    def test_get_user_game_stats(self):
        """Test getting user game stats endpoint."""
        response = self.client.get(
            "/api/user/game-stats",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode())
        self.assertIn("game_stats", data)
        self.assertEqual(len(data["game_stats"]), 2)  # Should have 2 game stats

    def test_get_user_stats_summary(self):
        """Test getting user stats summary endpoint."""
        response = self.client.get(
            "/api/user/game-stats/summary",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode())
        self.assertEqual(data["total_games"], 2)
        self.assertEqual(data["wins"], 1)
        self.assertEqual(data["win_rate"], 50.0)
        self.assertIn("best_times", data)
        self.assertEqual(data["best_times"]["EASY"], 45)  # Best time for easy level

# backend/tests/conftest.py
import pytest
from app import create_app
from models import db as _db

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app("testing")
    
    # Establish an application context
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def db(app):
    """Database session for testing."""
    return _db