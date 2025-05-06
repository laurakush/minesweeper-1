import os

class Config:
    # Database Configuration    
    SQLALCHEMY_DATABASE_URI = os.environ.get('MS_DATABASE_URI', 'mysql+pymysql://username:password@localhost/minesweeper')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret Keys - CHANGE THESE IN PRODUCTION!
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    
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
