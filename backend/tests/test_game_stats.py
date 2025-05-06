import unittest
import json
from app import create_app
from config import TestingConfig
from models import db, User, GameStats
from flask_bcrypt import Bcrypt

class GameStatsTestCase(unittest.TestCase):
    """Test case for game stats endpoints."""

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