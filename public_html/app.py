# Backend (using Flask)
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bikeshop.db"
db = SQLAlchemy(app)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255), nullable=False)
    bike_details = db.Column(db.String(255), nullable=False)
    cost = db.Column(db.Float, nullable=False)

@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.json
    task = Task(description=data["description"], bike_details=data["bike_details"], cost=data["cost"])
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task created", "task": task.id})

@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{"id": task.id, "description": task.description, "bike_details": task.bike_details, "cost": task.cost} for task in tasks])

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
