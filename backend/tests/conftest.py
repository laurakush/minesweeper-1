import pytest
from app import create_app
from config import TestingConfig
from models import db as _db

@pytest.fixture(scope='function')
def app():
    """Create and configure a Flask app for testing."""
    app = create_app(TestingConfig)
    
    # Establish an application context
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope='function')
def db(app):
    """Database session for testing."""
    return _db