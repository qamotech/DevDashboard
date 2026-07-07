from flask import Flask, jsonify
from flask_cors import CORS
import random
import datetime

app = Flask(__name__)
CORS(app) # Allows your frontend to talk to this backend

# Simulated data structure - eventually your Open Baltimore scraper will populate this
def get_parking_data():
    return {
        "sys_status": "ONLINE",
        "timestamp": datetime.datetime.now().isoformat() + "Z",
        "nodes": [
            {
                "id": "DOT_LOT_01",
                "name": "Edison Hwy Hub",
                "lat": 39.3051, 
                "lng": -76.5744, # Baltimore 21206 adjacent
                "capacity": {"max": 100, "open": random.randint(0, 30)},
                "rate": "$2.00/hr"
            },
            {
                "id": "DOT_LOT_02",
                "name": "Erdman Ave Transfer",
                "lat": 39.3110,
                "lng": -76.5650,
                "capacity": {"max": 50, "open": random.randint(0, 5)},
                "rate": "$1.50/hr"
            },
            {
                "id": "DOT_LOT_03",
                "name": "Belair Rd Node",
                "lat": 39.3200,
                "lng": -76.5500,
                "capacity": {"max": 75, "open": 0}, # Force a 'Full' state for testing
                "rate": "$2.50/hr"
            }
        ]
    }

@app.route('/api/parking', methods=['GET'])
def parking_endpoint():
    data = get_parking_data()
    return jsonify(data)

if __name__ == '__main__':
    # Runs the terminal server on port 5000
    print("> SYS.PARKING_LOCATOR_v1.0 [ONLINE]")
    app.run(debug=True, port=5000)