# Notification Service

This is a simple microservice for sending notifications in the Mini-InstaPay platform. It simulates sending notifications (e.g., email, SMS, push) by logging them to the console.

## Endpoints

### POST /notify
Send a notification to a user.

**Request Body:**
```
{
  "user": "username",
  "message": "Your notification message."
}
```

**Response:**
```
{
  "status": "Notification sent"
}
```

### GET /
Health check endpoint. Returns a simple message.

## Running Locally

```
npm install
npm start
```

The service will listen on port 3003 by default. 