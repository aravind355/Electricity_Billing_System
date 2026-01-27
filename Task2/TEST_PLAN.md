# Test Plan

## Test Strategy
- **Unit Testing**: Validate utility functions (calculations, validation).
- **Integration Testing**: Test API endpoints with valid/invalid inputs.
- **System Testing**: Manual verification of implementation via Frontend.

## Test Cases

### 1. Registration (`POST /api/register`)

| Test ID | Functionality | Input Data | Expected Output | Actual Output | Status |
|---------|---------------|------------|-----------------|---------------|--------|
| TC01 | Register Valid User | Name: "John Doe", Phone: "9876543210" | 200 OK + Service No | | |
| TC02 | Invalid Name | Name: "John123" | 400 Bad Request | | |
| TC03 | Invalid Phone | Phone: "123" | 400 Bad Request | | |
| TC04 | Duplicate Application | Duplicate Service No (Simulated) | Unique Service No (Auto-generated) | | |

### 2. Login (`POST /api/login`)

| Test ID | Functionality | Input Data | Expected Output | Actual Output | Status |
|---------|---------------|------------|-----------------|---------------|--------|
| TC05 | Valid Admin Login | 11111 / admin@111 | 200 OK + Role: Admin | | |
| TC06 | Invalid Password | 11111 / wrongpass | 401 Unauthorized | | |
| TC07 | Unapproved User | Newly registered service no | 403 Account Pending | | |

### 3. Bill Calculation (`utils/billing.js`)

| Test ID | Input Units | Type | Expected Bill (₹) | Actual Bill | Status |
|---------|-------------|------|-------------------|-------------|--------|
| TC08 | 0 | Household | 25 (Min Charge) | | |
| TC09 | 50 | Household | 25 + (50 * 1.5) = 100 | | |
| TC10 | 100 | Household | 25 + 75 + (50 * 2.5) = 225 | | |
| TC11 | 200 | Household | 25 + 75 + 125 + 175 + (50 * 4.5) = 625 | | |
| TC12 | 200 | Commercial | Rate + 1 for each slab | | |

### 4. Bill Generation (`POST /api/employee/add-usage`)

| Test ID | Functionality | Input Data | Expected Output | Actual Output | Status |
|---------|---------------|------------|-----------------|---------------|--------|
| TC13 | Generate Bill | Valid ServiceNo, Units: 100 | 200 OK + Bill Object | | |
| TC14 | Invalid User | Wrong ServiceNo | 404 Not Found | | |

### 5. Payment (`POST /api/payment`)

| Test ID | Functionality | Input Data | Expected Output | Actual Output | Status |
|---------|---------------|------------|-----------------|---------------|--------|
| TC15 | Pay Pending Bill | Valid Bill ID, Amount | 200 OK + Transaction ID | | |
| TC16 | Duplicate Pay | Paid Bill ID | 400 Bill already paid | | |

## Test Report
*To be filled after execution.*
