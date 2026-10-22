from flask import Blueprint, jsonify, request
from groq import GroqError
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from backend import ask, db
from backend.models.models import User

bp = Blueprint("api", __name__)


def _json_payload():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else None


@bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@bp.route("/register", methods=["POST"])
def register():
    data = _json_payload()
    if data is None:
        return jsonify({"error": "A JSON object is required"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    if not all(isinstance(value, str) and value.strip() for value in (username, email, password)):
        return jsonify({"error": "Username, email, and password are required"}), 400

    username = username.strip()
    email = email.strip().lower()
    if len(username) > 80 or len(email) > 120:
        return jsonify({"error": "Username or email is too long"}), 400
    if User.query.filter(
        db.or_(User.username == username, User.email == email)
    ).first():
        return jsonify({"error": "Username or email is already registered"}), 409

    user = User(
        username=username,
        email=email,
        password=generate_password_hash(password),
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Username or email is already registered"}), 409
    return jsonify({"message": "User registered successfully", "user": username}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = _json_payload()
    if data is None:
        return jsonify({"error": "A JSON object is required"}), 400

    username = data.get("username")
    password = data.get("password")
    if not isinstance(username, str) or not username.strip() or not isinstance(password, str) or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username.strip()).first()
    if user is None or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid username or password"}), 401
    return jsonify({"message": "Login successful", "user": user.username}), 200


@bp.route("/ask", methods=["POST"])
def ask_question():
    data = _json_payload()
    if data is None:
        return jsonify({"error": "A JSON object is required"}), 400

    username = data.get("user")
    password = data.get("password")
    question = data.get("question")
    if not all(isinstance(value, str) and value.strip() for value in (username, password, question)):
        return jsonify({"error": "Username, password, and question are required"}), 400

    user = User.query.filter_by(username=username.strip()).first()
    if user is None or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid username or password"}), 401

    try:
        answer = ask(question.strip())
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 503
    except GroqError:
        return jsonify({"error": "The AI service is temporarily unavailable"}), 502
    return jsonify({"answer": answer}), 200


@bp.route("/delete", methods=["DELETE"])
def delete_user():
    data = _json_payload()
    if data is None:
        return jsonify({"error": "A JSON object is required"}), 400

    username = data.get("username")
    password = data.get("password")
    if not isinstance(username, str) or not username.strip() or not isinstance(password, str) or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username.strip()).first()
    if user is None or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid username or password"}), 401

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200
