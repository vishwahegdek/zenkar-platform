# Backend API Curl Tests
Use this file to store and organize `curl` commands for manual backend testing. Update it regularly as APIs evolve.

## Variable Defaults
*   **URL**: `http://localhost:3000/api`
*   **Content-Type**: `application/json`

---

## 1. Authentication

### Login (Get Token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpassword"
  }'
```
*Response should contain `access_token`.*

---

## 2. Customers

### Create Customer
```bash
TOKEN="YOUR_ACCESS_TOKEN_HERE"

curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "mobile": "9876543210",
    "place": "Bangalore"
  }'
```

### Search Customers
```bash
curl -X GET "http://localhost:3000/api/customers?search=John" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Orders

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_UUID",
    "status": "PENDING",
    "items": []
  }'
```

