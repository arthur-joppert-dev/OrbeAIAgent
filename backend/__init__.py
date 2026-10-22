from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db = SQLAlchemy(app)

def ask(txt):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    completion = Groq(api_key=api_key).chat.completions.create(
        messages=[{"role": "user", "content": txt}],
        model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
    )
    answer = completion.choices[0].message.content
    if answer is None:
        raise RuntimeError("The AI service returned an empty response")
    return answer

from backend.models.models import User
from backend.routes.router import bp as bp
app.register_blueprint(bp)