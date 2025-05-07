import os

class Config:
    # Database Configuration    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'mysql+pymysql://username:password@localhost/minesweeper')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # Token expires after 1 hour
    
    # Enable CORS
    CORS_HEADERS = 'Content-Type'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    JWT_ACCESS_TOKEN_EXPIRES = 300  # Increase to 5 minutes for testing
    JWT_ALGORITHM = 'HS256'  # Explicitly set algorithm
