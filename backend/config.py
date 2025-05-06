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
    
# Update create_app in app.py to accept config_class parameter
# app.py modification below (reference only, full app.py updates would be made separately)
"""
def create_app(config_class=Config):
    # Initialize Flask app
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    ...
"""

# backend/tests/__init__.py
# Empty init file to make the tests directory a package

# backend/pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*