from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
db = SQLAlchemy(app)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(80), nullable=False)
    bike_details = db.Column(db.String(120), nullable=False)
    cost = db.Column(db.Float, nullable=False)

db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks', methods=['POST'])
def create_task():
    description = request.json['description']
    bike_details = request.json['bike_details']
    cost = request.json['cost']

    task = Task(description=description, bike_details=bike_details, cost=cost)
    db.session.add(task)
    db.session.commit()

    return jsonify({"task": task.id}), 201

@app.route('/tasks')
def get_tasks():
    tasks = Task.query.all()
    tasks_list = [{"id": task.id, "description": task.description, "bike_details": task.bike_details, "cost": task.cost} for task in tasks]
    return jsonify(tasks_list)

if __name__ == '__main__':
    app.run(debug=True)
