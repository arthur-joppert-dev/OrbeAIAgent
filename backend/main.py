import os

from backend import app, db

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(
        debug=os.getenv("FLASK_DEBUG") == "1",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "3000")),
    )
