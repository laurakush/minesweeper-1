import json
import unittest
from app import create_app
from config import TestingConfig
from models import db, User, GameStats
from flask_bcrypt import Bcrypt

class APIIntegrationTestCase(unittest.TestCase):
    """Test case for API integration scenarios."""

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

    def test_registration_to_stats_flow(self):
        """Test complete user flow from registration to saving game stats."""
        # 1. Register a new user
        register_response = self.client.post(
            "/api/register",
            data=json.dumps({
                "username": "testplayer",
                "password": "gameplay123",
                "email": "player@example.com"
            }),
            content_type="application/json"
        )
        self.assertEqual(register_response.status_code, 201)
        register_data = json.loads(register_response.data.decode())
        token = register_data["access_token"]
        
        # 2. Verify user is properly created
        user = User.query.filter_by(username="testplayer").first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, "player@example.com")
        
        # 3. Get user profile with token
        profile_response = self.client.get(
            "/api/user",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(profile_response.status_code, 200)
        profile_data = json.loads(profile_response.data.decode())
        self.assertEqual(profile_data["user"]["username"], "testplayer")
        
        # 4. Save game stats (win)
        win_game_response = self.client.post(
            "/api/game-stats",
            data=json.dumps({
                "difficulty": "EASY",
                "time_taken": 45,
                "is_win": True,
                "mines_flagged": 10,
                "cells_opened": 71
            }),
            headers={"Authorization": f"Bearer {token}"},
            content_type="application/json"
        )
        self.assertEqual(win_game_response.status_code, 201)
        
        # 5. Save game stats (loss)
        loss_game_response = self.client.post(
            "/api/game-stats",
            data=json.dumps({
                "difficulty": "MEDIUM",
                "time_taken": 90,
                "is_win": False,
                "mines_flagged": 15,
                "cells_opened": 40
            }),
            headers={"Authorization": f"Bearer {token}"},
            content_type="application/json"
        )
        self.assertEqual(loss_game_response.status_code, 201)
        
        # 6. Get user game stats
        stats_response = self.client.get(
            "/api/user/game-stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(stats_response.status_code, 200)
        stats_data = json.loads(stats_response.data.decode())
        self.assertEqual(len(stats_data["game_stats"]), 2)
        
        # 7. Get stats summary
        summary_response = self.client.get(
            "/api/user/game-stats/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(summary_response.status_code, 200)
        summary_data = json.loads(summary_response.data.decode())
        self.assertEqual(summary_data["total_games"], 2)
        self.assertEqual(summary_data["wins"], 1)
        self.assertEqual(summary_data["win_rate"], 50.0)
        self.assertEqual(summary_data["best_times"]["EASY"], 45)
        
    def test_invalid_token_access(self):
        """Test accessing protected endpoints with invalid token."""
        # Try to access protected endpoint with invalid token
        response = self.client.get(
            "/api/user",
            headers={"Authorization": "Bearer invalid_token"}
        )
        self.assertEqual(response.status_code, 422)  # Unprocessable Entity for invalid token
        
    def test_expired_token_flow(self):
        """Test flow with token expiration."""
        # This test would need to be implemented with a very short token expiration
        # and time manipulation, but for now we'll just create a placeholder
        pass
        
    def test_concurrent_game_sessions(self):
        """Test saving stats from multiple game sessions."""
        # 1. Register a user
        register_response = self.client.post(
            "/api/register",
            data=json.dumps({
                "username": "concurrent",
                "password": "testpass",
                "email": "concurrent@example.com"
            }),
            content_type="application/json"
        )
        token = json.loads(register_response.data.decode())["access_token"]
        
        # 2. Save multiple game stats in quick succession (simulating concurrent sessions)
        game_data = {
            "difficulty": "EASY",
            "time_taken": 30,
            "is_win": True,
            "mines_flagged": 5,
            "cells_opened": 50
        }
        
        # Save 5 identical game records
        for _ in range(5):
            response = self.client.post(
                "/api/game-stats",
                data=json.dumps(game_data),
                headers={"Authorization": f"Bearer {token}"},
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 201)
        
        # 3. Verify all game records were saved
        stats_response = self.client.get(
            "/api/user/game-stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        stats_data = json.loads(stats_response.data.decode())
        self.assertEqual(len(stats_data["game_stats"]), 5)

# backend/tests/test_database_integrity.py
import unittest
from datetime import datetime, timedelta
from app import create_app
from models import db, User, GameStats
from sqlalchemy.exc import IntegrityError

class DatabaseIntegrityTestCase(unittest.TestCase):
    """Test case for database integrity and constraints."""

    def setUp(self):
        """Set up the test environment."""
        self.app = create_app(TestingConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        """Clean up the test environment."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_unique_username_constraint(self):
        """Test that username must be unique."""
        # Create first user
        user1 = User(username="unique_user", password="hashedpwd1", email="user1@example.com")
        db.session.add(user1)
        db.session.commit()
        
        # Try to create second user with same username
        user2 = User(username="unique_user", password="hashedpwd2", email="user2@example.com")
        db.session.add(user2)
        
        # Should raise IntegrityError for unique constraint violation
        with self.assertRaises(IntegrityError):
            db.session.commit()
        
        # Rollback for next test
        db.session.rollback()

    def test_unique_email_constraint(self):
        """Test that email must be unique."""
        # Create first user
        user1 = User(username="email_user1", password="hashedpwd1", email="same@example.com")
        db.session.add(user1)
        db.session.commit()
        
        # Try to create second user with same email
        user2 = User(username="email_user2", password="hashedpwd2", email="same@example.com")
        db.session.add(user2)
        
        # Should raise IntegrityError for unique constraint violation
        with self.assertRaises(IntegrityError):
            db.session.commit()
        
        # Rollback for next test
        db.session.rollback()

    def test_user_delete_cascade(self):
        """Test that deleting a user cascades to their game stats."""
        # Create a user
        user = User(username="cascade_user", password="hashedpwd", email="cascade@example.com")
        db.session.add(user)
        db.session.commit()
        
        # Add game stats for the user
        stats1 = GameStats(
            user_id=user.id,
            difficulty="EASY",
            time_taken=30,
            is_win=True
        )
        stats2 = GameStats(
            user_id=user.id,
            difficulty="MEDIUM",
            time_taken=60,
            is_win=False
        )
        db.session.add_all([stats1, stats2])
        db.session.commit()
        
        # Verify game stats exist
        stats_count = GameStats.query.filter_by(user_id=user.id).count()
        self.assertEqual(stats_count, 2)
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        # Verify all associated game stats are deleted
        stats_count = GameStats.query.filter_by(user_id=user.id).count()
        self.assertEqual(stats_count, 0)

    def test_timestamps_auto_set(self):
        """Test that timestamps are automatically set on creation."""
        # Create a user
        user = User(username="timestamp_user", password="hashedpwd", email="time@example.com")
        db.session.add(user)
        db.session.commit()
        
        # Verify created_at was automatically set
        self.assertIsNotNone(user.created_at)
        
        # Create game stats
        stats = GameStats(
            user_id=user.id,
            difficulty="EASY",
            time_taken=30,
            is_win=True
        )
        db.session.add(stats)
        db.session.commit()
        
        # Verify played_at was automatically set
        self.assertIsNotNone(stats.played_at)
        
        # Verify timestamps are recent
        now = datetime.utcnow()
        self.assertTrue(now - user.created_at < timedelta(seconds=5))
        self.assertTrue(now - stats.played_at < timedelta(seconds=5))