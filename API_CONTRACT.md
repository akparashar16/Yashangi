# API Contract for Cart, Order & PhonePe Payment

This document describes the API contract used by the Next.js frontend so your connected backend can implement the same endpoints.

---

## 1. Place Order (save cart data in database)

**Purpose:** Save cart data and shipping info in DB, create order, return order details. Frontend then uses `orderId` and `totalAmount` to call PhonePe.

**Method:** `POST`  
**Paths (try in order):**
- `/api/Order/PlaceOrder`
- `/api/order/placeorder`
- `/api/Checkout/Submit`
- `/api/checkout/submit`

**Headers:**
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <token>` (if logged in)
- `userId: <number>` (optional)

**Request body (one of these shapes):**

With wrapper:
```json
{
  "request": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Street",
    "city": "City",
    "pincode": "110001",
    "state": "State",
    "phone": "9876543210",
    "country": "1",
    "paymentMethod": "PhonePe",
    "userId": 1,
    "totalAmount": 1999.00,
    "items": [...],
    "cartItems": [...],
    "orderItems": [...]
  },
  "items": [...],
  "cartItems": [...],
  "orderItems": [...],
  "totalAmount": 1999.00,
  "userId": 1
}
```

Direct (no wrapper):
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Street",
  "city": "City",
  "pincode": "110001",
  "state": "State",
  "phone": "9876543210",
  "country": "1",
  "paymentMethod": "PhonePe",
  "userId": 1,
  "totalAmount": 1999.00,
  "items": [
    {
      "productId": 1,
      "productName": "Product Name",
      "quantity": 2,
      "size": "M",
      "unitPrice": 999.50,
      "lineTotal": 1999.00,
      "imageUrl": "..."
    }
  ],
  "cartItems": [...],
  "orderItems": [...]
}
```

**Response (200 OK):**
```json
{
  "orderId": "ORD-12345",
  "id": 12345,
  "totalAmount": 1999.00,
  "status": "Pending"
}
```

At least one of `orderId` or `id` must be returned so the frontend can initiate PhonePe and later update payment status.

---

## 2. Initiate PhonePe (get payment page URL)

**Purpose:** Create payment on PhonePe, return payment page URL. Frontend redirects user to this URL.

**Method:** `POST`  
**Paths (try in order):**
- `/api/Payment/InitiatePhonePe`
- `/api/payment/initiatephonepe`
- `/api/Payment/CreatePayment`
- `/api/Payment/PhonePe`
- `/api/PhonePe/Initiate`

**Headers:**
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <token>`
- `userId: <number>`

**Request body (with or without wrapper):**
```json
{
  "request": {
    "orderId": "ORD-12345",
    "userId": 1,
    "amount": 1999.00,
    "currency": "INR",
    "callbackUrl": "https://yoursite.com/payment/callback",
    "redirectUrl": "https://yoursite.com/payment/callback",
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "customerEmail": "user@example.com"
  }
}
```
or same fields at top level without `request`.

**Response (200 OK):**
Return the PhonePe payment page URL in one of these forms:
```json
{
  "paymentUrl": "https://mercury-uat.phonepe.com/...",
  "redirectUrl": "https://mercury-uat.phonepe.com/...",
  "url": "https://mercury-uat.phonepe.com/..."
}
```
Or nested (PhonePe style):
```json
{
  "data": {
    "instrumentResponse": {
      "redirectInfo": "https://mercury-uat.phonepe.com/..."
    }
  }
}
```
Frontend uses this URL to redirect the user to PhonePe.

---

## 3. Payment callback / update status (after redirect from PhonePe)

**Purpose:** When user returns from PhonePe, frontend sends redirect query params to your API so you can update order/payment status in DB.

**Method:** `POST`  
**Paths (try in order):**
- `/api/Payment/UpdatePaymentStatus`
- `/api/payment/updatepaymentstatus`
- `/api/Payment/PhonePeCallback`
- `/api/payment/phonepecallback`
- `/api/Payment/Callback`
- `/api/payment/callback`

**Headers:**
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <token>`
- `userId: <number>`

**Request body:** All query params PhonePe sends on redirect, e.g.:
```json
{
  "orderId": "ORD-12345",
  "transactionId": "TXN_xxx",
  "status": "Success",
  "code": "PAYMENT_SUCCESS",
  "message": "Payment successful",
  "request": { ... same fields ... }
}
```

**Response (200 OK):**
```json
{
  "orderId": "ORD-12345",
  "status": "Success",
  "paymentStatus": "Success"
}
```

Your API should:
- Update the order’s payment status in the database (e.g. Success / Failed).
- Optionally store `transactionId` and other PhonePe response fields.

---

## 4. Verify payment status

**Purpose:** Frontend checks current payment status for an order (e.g. after callback).

**Method:** `GET`  
**Paths:**
- `/api/Payment/VerifyPayment/{orderId}`
- `/api/Payment/GetPaymentStatus/{orderId}`
- `/api/Payment/Status/{orderId}`

**Headers:**
- `Authorization: Bearer <token>`
- `userId: <number>`
- `transactionId: <string>` (optional)

**Response (200 OK):**
```json
{
  "status": "Success",
  "paymentStatus": "Success"
}
```

---

## Flow summary

1. **Checkout:** Frontend sends cart items + shipping to **Place Order** → API saves order in DB → returns `orderId` and `totalAmount`.
2. **PhonePe:** Frontend calls **Initiate PhonePe** with `orderId`, amount, callback/redirect URLs → API returns **payment page URL** → frontend redirects user to PhonePe.
3. **Redirect:** User completes/cancels payment → PhonePe redirects to `redirectUrl` (e.g. `https://yoursite.com/payment/callback?orderId=...&code=PAYMENT_SUCCESS&transactionId=...`).
4. **Callback:** Frontend calls **Update payment status / Callback** with all query params → API updates order payment status in DB.
5. **Verify:** Frontend may call **Verify payment status** to show success/failure and redirect to “My Orders”.

Ensure your base URL is set in the frontend (e.g. `NEXT_PUBLIC_API_BASE_URL`) to point to this API.
