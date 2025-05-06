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
    JWT_ACCESS_TOKEN_EXPIRES = 5  # Short expiration for testing
