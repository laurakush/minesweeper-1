from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)  # Will store hashed password
    email = db.Column(db.String(100), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with GameStats
    game_stats = db.relationship('GameStats', backref='user', lazy=True, 
                                 cascade="all, delete-orphan")    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class GameStats(db.Model):
    __tablename__ = 'game_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Game details
    difficulty = db.Column(db.String(20), nullable=False)  # EASY, MEDIUM, HARD
    time_taken = db.Column(db.Integer, nullable=False)  # in seconds
    is_win = db.Column(db.Boolean, default=False)
    mines_flagged = db.Column(db.Integer, default=0)
    cells_opened = db.Column(db.Integer, default=0)
    
    # Timestamps
    played_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<GameStats {self.id} - User {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'difficulty': self.difficulty,
            'time_taken': self.time_taken,
            'is_win': self.is_win,
            'mines_flagged': self.mines_flagged,
            'cells_opened': self.cells_opened,
            'played_at': self.played_at.isoformat() if self.played_at else None
        }
