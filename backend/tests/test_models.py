import unittest
from config import TestingConfig
from datetime import datetime
from app import create_app
from models import db, User, GameStats
from flask_bcrypt import Bcrypt

class ModelsTestCase(unittest.TestCase):
    """Test case for the app models."""

    def setUp(self):
        """Set up the test environment."""
        self.app = create_app(TestingConfig)
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