# Zenkar Platform

The **Zenkar Platform** is a modern, mobile-first Order Book application designed to replace the legacy system. It features a robust **NestJS** backend and a responsive **React** frontend.

## 🚀 Technology Stack

*   **Backend**: NestJS (Node.js framework)
*   **Frontend**: React (Vite + TailwindCSS)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Containerization**: Docker & Docker Compose
*   **Documentation**: Swagger / OpenAPI

## 🛠️ Prerequisites

*   Node.js (v20 or higher)
*   Docker & Docker Compose
*   Git

## 🏁 Getting Started (Local Development)

### 1. clone the repository
```bash
git clone <repository-url>
cd zenkar-platform
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure Environment
# Ensure .env contains DATABASE_URL="postgresql://postgres:postgres@localhost:5432/order_book?schema=public"

# Start Database (if not using local Postgres)
cd ..
docker-compose up -d db

# Run Migrations
cd backend
npx prisma generate
npx prisma migrate dev

# Start Server
npm run start:dev
```
*Backend runs on: `http://localhost:3000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

## 🤖 AI-Friendly Features

This project is optimized for collaboration with AI agents.

*   **API Documentation**: 
    *   Full Swagger/OpenAPI documentation is available at **[`http://localhost:3000/api/docs`](http://localhost:3000/api/docs)**.
    *   Agents can use this to understand the schema and available endpoints.
*   **Testing**:
    *   Run `npm test` in the `backend` directory to execute the test suite.
    *   Includes Unit tests for critical services (e.g., `OrdersService`).
*   **Architecture**:
    *   Strict layering (Controller -> Service -> Data Access).
    *   Single Source of Truth: `backend/prisma/schema.prisma`.

## 📦 Deployment

For detailed deployment instructions, please refer to [docs/deployment.md](docs/deployment.md).

### Quick Build
```bash
docker-compose up --build -d
```
