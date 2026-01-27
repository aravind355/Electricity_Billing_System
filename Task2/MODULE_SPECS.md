# Module Specifications

## 1. Authentication Module (`middleware/auth.js`)
**Function**: `requireAuth(roles)`
- **Input**: `roles` (Array of Strings) - Optional list of allowed roles.
- **Preconditions**: Session must exist (`req.session`).
- **Logic**:
  1. Check if `req.session.user` exists. If not, return 401.
  2. If `roles` provided, check if `req.session.user.role` is in `roles`. If not, return 403.
  3. Call `next()` to proceed.
- **Output**: Calls next middleware or returns JSON Error Response.

## 2. Billing Calculation Module (`utils/billing.js`)
**Function**: `calculateBill(units, type)`
- **Input**: 
  - `units` (Number) - Total units consumed.
  - `type` (String) - Consumer type ('household', 'commercial', 'industrial').
- **Preconditions**: `units` >= 0.
- **Logic**:
  1. Initialize `bill` with Minimum Charge (₹25).
  2. Determine rates based on `type`.
  3. If `units` <= 50: `bill += units * rate`.
  4. If `units` <= 100: Calculate slab 1 (50 units) + slab 2 (remainder).
  5. If `units` <= 150: Calculate slab 1 + slab 2 + slab 3 (remainder).
  6. If `units` > 150: Calculate first 3 slabs + remaining units at Max Rate.
- **Output**: `bill` (Number) - Total bill amount.

**Function**: `calculateFine(dueDate, currentDate)`
- **Input**: `dueDate` (Date), `currentDate` (Date).
- **Logic**:
  1. If `currentDate` <= `dueDate`, return 0.
  2. Calculate difference in days.
  3. `monthsLate` = ceil(diffDays / 30).
  4. `fine` = `monthsLate` * 150.
- **Output**: `fine` (Number).

## 3. Validation Module (`utils/validation.js`)
**Function**: `validateName(name)`
- **Input**: `name` (String).
- **Logic**: Regex `/^[a-zA-Z\s]+$/` to check for only alphabets and spaces.
- **Output**: Boolean.

**Function**: `validatePhone(phone)`
- **Input**: `phone` (String).
- **Logic**: Regex `/^\d{10}$/` for exactly 10 digits.
- **Output**: Boolean.

## 4. Auth Routes (`routes/auth.js`)
**Endpoint**: `POST /register`
- **Input**: JSON { name, phone, email, address, pincode, type }.
- **Logic**: Validate inputs -> Generate unique Service No -> Create User -> Save to DB.
- **Output**: JSON Success Message with Service No or Error.

**Endpoint**: `POST /login`
- **Input**: JSON { serviceNo, password }.
- **Logic**: Find User -> Validated Password -> Check Approval -> Create Session -> Log Login Time.
- **Output**: JSON Success Message + User Info or Error.

## 5. Bill Routes (`routes/employee.js`, `routes/bills.js`)
**Endpoint**: `POST /employee/add-usage`
- **Input**: JSON { serviceNo, units, month, readingDate }.
- **Logic**: 
  1. Find User -> Calculate Bill Amount.
  2. Calculate Previous Pending.
  3. Create Bill with calculated Due Date.
  4. Save Bill.
- **Output**: JSON Success + Bill Object.
