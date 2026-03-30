from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

AWS_GATEWAY_URL = "https://yw070wnzzd.execute-api.ap-south-1.amazonaws.com/monitor"
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/poll_api', methods=['POST'])
def poll_api():
    try:
        data = request.json
        api_url = data.get('url')
        
        payload = {"url": api_url} 

        AWS_URL = "https://yw070wnzzd.execute-api.ap-south-1.amazonaws.com/monitor"
        
        response = requests.post(
            AWS_URL, 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            print(f"❌ Cloud rejected the hit: {response.status_code}")
            return jsonify({"status": "DOWN"}), response.status_code

    except Exception as e:
        print(f"🚨 Flask Error: {str(e)}")
        return jsonify({"status": "DOWN"}), 500
if __name__ == '__main__':
    app.run(debug=True, port=5000)