# Zenkar Platform - Technical Documentation

## 1. Architecture Overview

The Zenkar Platform is a modern order management system built with a decoupled Monorepo architecture.

### Technology Stack
*   **Backend**: NestJS (Node.js)
    *   **Database**: PostgreSQL (via Prisma ORM)
    *   **Object Storage**: MinIO (S3 compatible) for images
    *   **Authentication**: Google OAuth 2.0 + JWT
*   **Frontend**: React (Vite)
    *   **Styling**: TailwindCSS (v4)
    *   **State Management**: React Query
*   **Infrastructure**: Docker & Docker Compose
    *   **Reverse Proxy**: Nginx (Production)

## 2. Folder Structure

```
zenkar-platform/
├── backend/            # NestJS Application
│   ├── src/
│   │   ├── auth/       # Authentication (Google Strategy, JWT)
│   │   ├── orders/     # Order Management Logic
│   │   ├── products/   # Product Catalog
│   │   └── customers/  # Customer Profiles
│   ├── prisma/         # Database Schema
│   └── test/           # E2E Tests
├── frontend/           # React Application
│   ├── src/
│   │   ├── pages/      # Route Components
│   │   ├── components/ # Reusable UI Components
│   │   └── context/    # AuthContext
├── deploy/             # Deployment configurations
│   ├── production/     # Production Docker Compose
│   └── staging/        # Staging configurations
└── docs/               # Project Documentation
```

## 3. Core Services

### Authentication Flow
1.  Frontend redirects user to `/api/auth/google`.
2.  Backend handles OAuth callback and issues a JWT in a cookie (`Authentication`).
3.  Frontend checks `/api/auth/status` to confirm login state.

### Image Handling
*   Images are uploaded to MinIO via the backend.
*   `sharp` is used for image optimization (creating thumbnails and optimized versions).
*   Images are stored with unique keys in MinIO buckets (`products`, `orders`).

### Database (Prisma)
See `backend/prisma/schema.prisma` for the source of truth.
*   **Users**: Admin users who can access the system.
*   **Customers**: People placing orders.
*   **Products**: Items available for order.
*   **Orders**: The central entity linking Customers, Products (via OrderItems), and Payments.

## 4. Setup & Installation

### Prerequisites
*   Node.js (v20+)
*   Docker & Docker Compose

### Local Development
1.  **Clone the repository**:
    ```bash
    git clone <repo_url>
    cd zenkar-platform
    ```
2.  **Start Infrastructure** (DB & MinIO):
    ```bash
    # Ensure you have a local docker-compose for dev, or run services manually
    docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    cd backend && npm install
    cd frontend && npm install
    ```
4.  **Backend Setup**:
    ```bash
    cd backend
    npx prisma migrate dev
    npm run start:dev
    ```
5.  **Frontend Setup**:
    ```bash
    cd frontend
    npm run dev
    ```

### Deployment (Production)
Deployment is managed via scripts in the root:
*   `deploy.sh`: Orchestrates the deployment.
*   `cicd.sh`: CI/CD script for pushing changes.
*   See `Context.md` for detailed deployment rules (Push Pipeline).

## 5. API Documentation
Swagger API docs are available at `/api/docs` when the backend is running.
