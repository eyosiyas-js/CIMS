# Design Document: Real-Time Traffic Police Response System

## Overview

The Real-Time Traffic Police Response System transforms the existing static detection-assignment workflow into a dynamic, location-aware, real-time response system. When a vehicle detection occurs at a camera, the system immediately identifies nearby traffic officers based on their live GPS coordinates and dispatches real-time alerts to their mobile devices. Officers can view alerts on a map, respond to incidents, update their status in real-time, and submit proof of completion. The system leverages the existing FastAPI backend, SQLAlchemy ORM, PostgreSQL database, and WebSocket infrastructure while introducing new models and APIs to support mobile officer management, geolocation tracking, and proximity-based alert routing.

## Architecture

```mermaid
graph TB
    subgraph "Detection Sources"
        CAM[Camera Network]
        ENGINE[Detection Engine]
    end
    
    subgraph "Backend Services"
        API[FastAPI Backend]
        WS[WebSocket Manager]
        GEO[Geolocation Service]
        ALERT[Alert Dispatcher]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        CACHE[Redis Cache<br/>Officer Locations]
    end
    
    subgraph "Clients"
        WEB[Web Dashboard]
        MOBILE[Mobile App<br/>Traffic Officers]
    end
    
    CAM -->|Detection Event| ENGINE
    ENGINE -->|Create Detection| API
    API -->|Store| DB
    API -->|Query Nearby Officers| GEO
    GEO -->|Read Locations| CACHE
    API -->|Dispatch Alert| ALERT
    ALERT -->|WebSocket Push| WS
    WS -->|Real-time Alert| MOBILE
    WS -->|Status Update| WEB
    MOBILE -->|GPS Updates| API
    API -->|Update Location| CACHE
    MOBILE -->|Status Updates| API
    API -->|Broadcast| WS
