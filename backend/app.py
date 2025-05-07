from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

from config import Config
from models import db
from routes import api

def create_app(config_class=Config):
    # Initialize Flask app
    app = Flask(__name__)
    
    # Handle either string or object configuration
    if isinstance(config_class, str):
        if config_class == "testing":
            from config import TestingConfig
            app.config.from_object(TestingConfig)
        else:
            app.config.from_object(Config)
    else:
        app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["https://minesweeperwinner.netlify.app/", "http://localhost:3000"]}}, supports_credentials=True)    JWTManager(app)
    Bcrypt(app)
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        return {'message': 'Minesweeper API is running'}
    
    return app
    
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)