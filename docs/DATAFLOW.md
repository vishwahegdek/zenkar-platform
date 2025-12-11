# Zenkar Platform - Dataflow Diagrams

This document visualizes the data flow for critical processes within the Zenkar Platform.

## 1. Authentication Flow (Google OAuth)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Backend
    participant GoogleAuth
    participant Database

    User->>Browser: Click "Login with Google"
    Browser->>Backend: GET /api/auth/google
    Backend->>GoogleAuth: Redirect to Google Login
    User->>GoogleAuth: Enter Credentials
    GoogleAuth->>Backend: Callback (Code)
    Backend->>GoogleAuth: Exchange Code for Profile
    GoogleAuth-->>Backend: User Profile
    Backend->>Database: Upsert User (Email/ID)
    Database-->>Backend: User Record
    Backend->>Browser: Set JWT Cookie & Redirect
    Browser->>Backend: GET /api/auth/status (with Cookie)
    Backend-->>Browser: Authenticated User Data
    Browser-->>User: Show Dashboard
```

## 2. Order Creation Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant Backend
    participant Database
    participant MinIO

    Admin->>Frontend: Fill Order Form
    Frontend->>Frontend: Validate Input
    Frontend->>Backend: POST /api/orders (JSON)
    Backend->>Backend: Validate DTO
    
    alt Has Images
        Frontend->>Backend: Upload Images (Multipart)
        Backend->>MinIO: PutObject (Raw)
        Backend->>MinIO: PutObject (Optimized/Thumb)
        MinIO-->>Backend: Storage Keys
    end

    Backend->>Database: Create Order & OrderItems
    Database-->>Backend: Order ID
    Backend-->>Frontend: Success Response
    Frontend-->>Admin: Show Success Toast & Redirect
```

## 3. Product Management

```mermaid
graph TD
    A[Admin] -->|Create Product| B(Frontend Product Form)
    B -->|Submit| C[Backend API]
    C -->|Store Info| D[(Postgres DB)]
    C -->|Upload Image| E[MinIO Storage]
    E -->|Return Key| C
    C -->|Link Image to Product| D
```

## 4. Payment Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant Backend
    participant Database

    Admin->>Frontend: Add Payment to Order
    Frontend->>Backend: POST /api/orders/:id/payments
    Backend->>Database: Create Payment Record
    Database-->>Backend: Payment ID
    Backend->>Database: Recalculate Order Balance? (Optional Logic)
    Backend-->>Frontend: Updated Payment List
    Frontend-->>Admin: Update UI
```
