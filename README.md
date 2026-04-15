# CIMS - Comprehensive Incident Management System

This repository contains the full source code for the CIMS project, including the Backend, Frontend, and Mobile application, along with a database dump for easy restoration.

## Project Structure

- `backend1/backend`: FastAPI backend logic.
- `front1`: React-based web dashboard.
- `mobile`: Expo-based mobile application for officers.
- `db_dump.sql`: PostgreSQL database export.

## Setup Instructions

### 1. Database Restoration

Ensure you have PostgreSQL installed. Create a database named `cims` and restore the dump:

```bash
# Create the database
createdb -U postgres cims

# Restore the dump
psql -U postgres -d cims -f db_dump.sql
```

*Note: Default password in codebase is `1234`.*

### 2. Backend Setup

1. Navigate to `backend1/backend`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 3. Frontend Setup

1. Navigate to `front1`.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```

### 4. Mobile Setup

1. Navigate to `mobile`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```

## Key Features

- **Traffic Police Dispatch**: Real-time, geo-proximity based assignment of officers for traffic-related detections.
- **Real-time Notifications**: WebSockets and Expo Push Notifications for instant alerts.
- **Officer Tracking**: Foreground and background (fallback) location tracking for officers.
- **Admin Dashboard**: Comprehensive analytics and device management.
