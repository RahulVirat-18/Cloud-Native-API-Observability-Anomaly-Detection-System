# 🧠 Cloud-Native API Behavior Intelligence Dashboard

A **real-time, serverless observability system** that monitors API performance, detects anomalies, and provides intelligent behavioral analysis through a modern web dashboard.

---

## 📋 Table of Contents
- [What This Project Does](#-what-this-project-does)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [How It Works](#-how-it-works)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Resume Impact](#-resume-impact)

---

## 🎯 What This Project Does

This is **NOT** a CRUD app, website builder, or static dashboard. It's a **real-time intelligence system** that:

✅ **Monitors ONE API continuously** — sends live requests every configurable interval (default: 2s)  
✅ **Captures real data** — latency, status codes, timestamps (no faking)  
✅ **Detects anomalies** — identifies latency spikes using statistical thresholds & sliding windows  
✅ **Simulates region-based performance** — realistic latency offsets for India (+15ms), US (+140ms), EU (+75ms)  
✅ **Streams live logs** — auto-scrolling log panel with color-coded status indicators  
✅ **Tracks error rates** — monitors failures, timeouts, and error percentages  
✅ **Generates alerts** — triggers when anomalies detected, maintains resolution history  
✅ **Provides insights** — region performance comparison, fastest/slowest regions, average latencies  

---

## ✨ Key Features

### 1. **Real-Time Latency Monitoring**
- Live latency graph (time-series)
- Updates every interval (2s default)
- Shows UP/DOWN status
- Visual anomaly indicators

### 2. **Intelligent Anomaly Detection**
- **Statistical threshold**: latency > average × 1.35
- **Consecutive increase detection**: 3+ rising values trigger alert
- **Fixed threshold comparison**: configurable fallback limit
- Maintains **sliding window** of last 10 latency values per region

### 3. **Region-Based Performance Simulation**
- **Independent tracking**: India, US, EU data never mixed
- **Realistic offsets**: base_latency + region_offset
- **2×2 Grid Dashboard**:
  - 3 mini-graphs (India, US, EU)
  - Insights block: fastest/slowest regions, average latencies
- Separate history per region (last 10 values each)

### 4. **Multi-Page Dashboard**
| Page | Purpose |
|------|---------|
| **Dashboard** | Real-time latency graph + live logs (main monitoring) |
| **Error Rate** | Total requests, failed requests, error %, most failing API |
| **Region Simulation** | Regional performance comparison with micro-graphs |
| **Alerts & History** | Full-width table: Time, API Name, Latency, Error, Alert Type, Status |
| **Settings** | Email alerts, theme toggle, default interval config |

### 5. **Failure Handling (Critical)**
When API fails:
- ❌ Timeout detected → shown in logs
- 🔴 Status bar shows "DOWN"
- 📊 Graph shows break or spike
- ⚠️ Alert triggered automatically

### 6. **Live Log Streaming**
- Auto-scrolling panel (newest on top)
- Format: `[HH:MM] Status → Latency`
- Color coding: 🟢 200-299, 🟡 300-399, 🔴 400+
- Example: `10:01 → 200 → 210ms` / `10:03 → 500 → 900ms ⚠️`

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│           WEB DASHBOARD (Frontend)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Dashboard │ │Error Rate│ │Regions   │ ...        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
└───────┼─────────────┼──────────┬─────────────────────┘
        │             │          │
        └─────────────┼──────────┘
                      ↓
            ┌────────────────────┐
            │  API Gateway       │ (HTTP Endpoint)
            └─────────┬──────────┘
                      ↓
        ┌─────────────────────────┐
        │  AWS Lambda             │
        │  - API Requests         │
        │  - Latency Calculation  │
        │  - Anomaly Detection    │
        │  - Region Simulation    │
        └──────────┬──────────────┘
                   ↓
      ┌────────────────────────┐
      │  DynamoDB              │
      │  - api_id (key)        │
      │  - region (sort key)   │
      │  - history (last 10)   │
      │  - last_lat            │
      │  - timestamp           │
      └────────────────────────┘

┌──────────────────────────────────────────────┐
│  CloudWatch                                  │
│  - Event Logs (Lambda execution)             │
│  - Monitoring (request metrics)              │
└──────────────────────────────────────────────┘
```

**Data Flow:**
1. Frontend sends: `{ url: "https://...", name: "My API", interval: 2000 }`
2. Lambda processes every 2 seconds (via scheduled trigger or frontend polling)
3. Lambda hits the target API, captures latency & status
4. Stores result in DynamoDB (per region)
5. Returns region-wise results to frontend
6. Frontend renders live graph + logs + status

---

## 📂 Project Structure

```
API_Intelligence_Dashboard/
├── app.py                          # Flask frontend app (local dev)
├── requirements.txt                # Python dependencies
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
│
├── API_Behaviour_Analysis/         # [EXCLUDED from git]
│   ├── app.py
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   └── requirements.txt
│
├── backend/
│   └── lambda_function.py          # Lambda handler (local copy)
│
├── lambda_dist/                    # [EXCLUDED from git]
│   ├── lambda_function.py          # Packaged Lambda function
│   └── bin/                        # Dependencies (boto3, requests, etc.)
│
├── env/                            # [EXCLUDED from git]
│   ├── Scripts/
│   └── Lib/
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
│
└── templates/
    └── index.html
```

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.9+
- AWS Account (Free Tier eligible)
- Git

### Local Development Setup

1. **Clone & Navigate**
   ```bash
   cd d:\Projects\API_Intelligence_Dashboard
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv env
   .\env\Scripts\Activate.ps1  # Windows PowerShell
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Locally**
   ```bash
   python app.py
   ```
   - Dashboard available at: `http://localhost:5000`

---

## 🔄 How It Works

### Step 1: Add API
User enters:
- **API URL**: `https://api.example.com/health`
- **API Name**: `Example API`
- **Interval**: `2000` (milliseconds)
- Clicks **START MONITORING**

### Step 2: Real-Time Monitoring Begins
Every 2 seconds (configurable):
```
Frontend → Lambda (via API Gateway)
  ↓
Lambda hits target URL
  ↓
Captures:
  - Status Code
  - Response Time (latency)
  - Timestamp
  ↓
Stores in DynamoDB (per region):
  - India: [base_lat + 15ms]
  - US: [base_lat + 140ms]
  - EU: [base_lat + 75ms]
  ↓
Returns to Frontend
  ↓
Frontend renders:
  - Graph updates
  - Log entry added
  - Status bar updated
```

### Step 3: Anomaly Detection
For each region, Lambda:
1. Maintains **sliding window** of last 10 latencies
2. Calculates **average**
3. Checks if: `current_latency > average × 1.35`
4. If true → **Anomaly Flag = True**
5. Alert stored in DynamoDB with timestamp

### Step 4: Dashboard Updates
- **Graph**: New point added (live animation)
- **Logs**: New entry with status & latency
- **Status Bar**: 🟢 OK / 🟡 Slow / 🔴 Down
- **Region Insights**: Min/max/avg updated

### Step 5: Error Handling
If API fails (timeout, 500, etc.):
- Status = **DOWN** 🔴
- Log shows: `ERROR → Timeout ❌`
- Latency = `null`
- Best practices: Retry logic, exponential backoff

---

## ⚙️ Configuration

### Frontend Settings (Persistent in LocalStorage)

```javascript
// Default values
const CONFIG = {
  defaultInterval: 2000,      // 2 seconds
  alertThreshold: 1.35,       // Latency > avg × 1.35
  emailAlerts: false,         // Email on anomaly
  theme: 'light',             // light | dark
  maxHistoryPoints: 10        // Sliding window size
};
```

### Backend Configuration (Lambda Environment)

```python
# Hardcoded for now (later → environment variables)
REGIONS = {
    "india": 15,    # +15ms offset
    "us": 140,      # +140ms offset
    "eu": 75        # +75ms offset
}

ANOMALY_THRESHOLD = 1.35  # 35% above average
MAX_HISTORY = 10          # Sliding window
```

### DynamoDB Schema

**Table Name**: `API_Monitor_State`

| Attribute | Type | Key |
|-----------|------|-----|
| `api_id` | String | Partition Key |
| `region` | String | Sort Key |
| `history` | List | Latency values (last 10) |
| `last_lat` | Number | Most recent latency |
| `timestamp` | Number | Unix timestamp |
| `is_anomaly` | Boolean | Anomaly flag |

Example Item:
```json
{
  "api_id": "Example_API",
  "region": "india",
  "history": [480, 500, 490, 515, 510, 520, 530, 525, 540, 550],
  "last_lat": 550,
  "timestamp": 1743379200,
  "is_anomaly": true
}
```

---

## ☁️ Deployment to AWS

### 1. Create DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name API_Monitor_State \
  --attribute-definitions AttributeName=api_id,AttributeType=S AttributeName=region,AttributeType=S \
  --key-schema AttributeName=api_id,KeyType=HASH AttributeName=region,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### 2. Package Lambda Function
```bash
# Copy dependencies
pip install -r requirements.txt -t lambda_dist/

# Copy handler
cp backend/lambda_function.py lambda_dist/

# Create zip
cd lambda_dist && zip -r ../lambda_function.zip . && cd ..
```

### 3. Deploy Lambda
```bash
aws lambda create-function \
  --function-name api-monitor \
  --runtime python3.11 \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda_function.zip
```

### 4. Create API Gateway Endpoint
```bash
aws apigateway create-rest-api --name api-monitor-api
# [Configure integration with Lambda]
# [Deploy to stage]
```

### 5. Deploy Frontend
- Build static assets (HTML/CSS/JS)
- Host on S3 + CloudFront OR
- Deploy to Heroku/Vercel for simplicity

---

## 💼 Resume Impact

### Strong One-Liner:
> "Built a cloud-native, real-time API observability dashboard with statistical anomaly detection and multi-region performance simulation using serverless AWS architecture."

### Skills Demonstrated:
✅ **Real-Time Systems**: Live data streaming, event-driven architecture  
✅ **Cloud-Native**: Serverless (Lambda), managed databases (DynamoDB), API Gateway  
✅ **Backend Engineering**: Async processing, database design, error handling  
✅ **Frontend Engineering**: Live charts/graphs, WebSocket simulation, multi-page SPA  
✅ **Data Analysis**: Sliding windows, statistical thresholds, anomaly detection  
✅ **DevOps**: AWS deployment, CI/CD, infrastructure as code potential  
✅ **Observability**: Monitoring, logging, alerting systems  

---

 

**AWS Cost Management Coverage:**
- ✅ Lambda: 1M requests/month free
- ✅ DynamoDB: 25GB storage + 25 RCU/WCU free
- ✅ API Gateway: 1M calls/month free
- ✅ CloudWatch: Limited free logs

**Cost Optimization:**
- Monitor 1 API only
- Poll every 2-5 seconds (not aggressive)
- 3 regions × 1 API = 3 DynamoDB items/poll
- Sliding window = fixed storage per region

 

---

## 🎥 Demo Flow

1. Open Dashboard → "No API added" message
2. Enter URL: `https://httpbin.org/delay/1`
3. Enter Name: `Test API`
4. Click **START MONITORING**
5. Watch:
   - 📊 Graph begins plotting points
   - 📝 Logs stream in real-time
   - 🟢 Status bar shows UP
   - 📍 Region data appears
6. Inject delay (or API fails)
   - 📈 Latency spikes
   - ⚠️ Anomaly detected → Alert
   - 📍 Alert moved to History
7. View Error Rate → shows stats
8. View Regions → compare performance
9. View Alerts → see active/resolved status

---

## 🔗 Resources

- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/amazondynamodb/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Real-Time Systems Design](https://en.wikipedia.org/wiki/Real-time_computing)

---

## 📝 Notes

- **NO static/fake data**: All values are real from actual API calls
- **NO hardcoded responses**: Dashboard is fully dynamic
- **NO filler content**: Every widget serves a purpose
- **Continuous development**: This is a foundation for advanced analytics

---

**Last Updated**: March 2026  
 
