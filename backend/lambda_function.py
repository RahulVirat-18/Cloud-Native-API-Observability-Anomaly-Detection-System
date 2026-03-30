import json
import time
import requests
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('API_Monitor_State')

def lambda_handler(event, context):
    try:
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
            
        target_url = body.get('url')
        api_name = body.get('name', 'Default_API')
    except Exception as e:
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid Input"})}

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}
    
    start_time = time.time()
    try:
        res = requests.get(target_url, timeout=5, headers=headers)
        base_latency = int((time.time() - start_time) * 1000)
        status = "UP" if res.status_code < 400 else "DOWN"
    except Exception as e:
        base_latency = None
        status = "DOWN"

    regions = {"india": 15, "us": 140, "eu": 75}
    final_results = {}

    for reg, offset in regions.items():
        reg_lat = (base_latency + offset) if status == "UP" else None
        
        try:
            db_res = table.get_item(Key={'api_id': api_name, 'region': reg})
            history = db_res.get('Item', {}).get('history', [])
        except:
            history = []

        if status == "UP":
            history.append(reg_lat)
            if len(history) > 10: history.pop(0)

        is_anomaly = False
        if len(history) == 10 and status == "UP":
            avg = sum(history) / 10
            if reg_lat > (avg * 1.35): is_anomaly = True

        table.put_item(Item={
            'api_id': api_name, 'region': reg,
            'history': history, 'last_lat': reg_lat,
            'timestamp': int(time.time())
        })

        final_results[reg] = {"latency": reg_lat, "is_anomaly": is_anomaly}

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "status": status,
            "base_ms": base_latency,
            "regions": final_results
        })
    }