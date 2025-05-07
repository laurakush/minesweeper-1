from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, User, GameStats

# Initialize blueprint and bcrypt
api = Blueprint('api', __name__)
bcrypt = Bcrypt()

# ===== Authentication Routes =====

@api.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Basic validation
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Check if username already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409
    
    # Check if email already exists (if provided)
    if data.get('email'):
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email already exists'}), 409
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create new user
    new_user = User(
        username=data['username'],
        password=hashed_password,
        email=data.get('email')
    )
    
    # Save to database
    db.session.add(new_user)
    db.session.commit()
    
    # Generate access token
    access_token = create_access_token(identity=new_user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': new_user.to_dict(),
        'access_token': access_token
    }), 201

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Find the user
    user = User.query.filter_by(username=data['username']).first()
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Generate access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@api.route('/user', methods=['GET'])
@jwt_required()
def get_user_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

# ===== Game Stats Routes =====

@api.route('/game-stats', methods=['POST'])
@jwt_required()
def save_game_stats():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Basic validation
    required_fields = ['difficulty', 'time_taken', 'is_win']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create new game stats record
    new_stats = GameStats(
        user_id=current_user_id,
        difficulty=data['difficulty'],
        time_taken=data['time_taken'],
        is_win=data['is_win'],
        mines_flagged=data.get('mines_flagged', 0),
        cells_opened=data.get('cells_opened', 0)
    )
    
    # Save to database
    db.session.add(new_stats)
    db.session.commit()
    
    return jsonify({
        'message': 'Game stats saved successfully',
        'game_stats': new_stats.to_dict()
    }), 201

@api.route('/user/game-stats', methods=['GET'])
@jwt_required()
def get_user_game_stats():
    current_user_id = get_jwt_identity()
    
    # Get all game stats for the current user
    stats = GameStats.query.filter_by(user_id=current_user_id).order_by(GameStats.played_at.desc()).all()
    
    return jsonify({
        'game_stats': [stat.to_dict() for stat in stats]
    }), 200

@api.route('/user/game-stats/summary', methods=['GET'])
@jwt_required()
def get_user_stats_summary():
    current_user_id = get_jwt_identity()
    
    # Get stats summary
    total_games = GameStats.query.filter_by(user_id=current_user_id).count()
    wins = GameStats.query.filter_by(user_id=current_user_id, is_win=True).count()
    
    # Get best times for each difficulty level (wins only)
    difficulties = ['EASY', 'MEDIUM', 'HARD']
    best_times = {}
    
    for difficulty in difficulties:
        best_game = GameStats.query.filter_by(
            user_id=current_user_id,
            difficulty=difficulty,
            is_win=True
        ).order_by(GameStats.time_taken).first()
        
        if best_game:
            best_times[difficulty] = best_game.time_taken
        else:
            best_times[difficulty] = None
    
    # Calculate win rate
    win_rate = (wins / total_games * 100) if total_games > 0 else 0
    
    return jsonify({
        'total_games': total_games,
        'wins': wins,
        'win_rate': round(win_rate, 2),
        'best_times': best_times
    }), 200

# ===== Refresh Route =====
@api.route('/refresh', methods=['POST'])
@jwt_required()
def refresh():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Generate a new access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Token refreshed successfully',
        'access_token': access_token
    }), 200