# Algorithms and Logic

## 1. Bill Calculation Algorithm

**Goal**: Calculate electricity bill based on slab rates and consumer type.

```pseudo
BEGIN calculateBill(units, type)
    CONSTANT MINIMUM_CHARGE = 25
    
    // Set Base and Max Rates
    IF type IS 'industrial' THEN
        baseRate = 3.5
        maxRate = 6.5
    ELSE IF type IS 'commercial' THEN
        baseRate = 2.5
        maxRate = 5.5
    ELSE // Household
        baseRate = 1.5
        maxRate = 4.5
    END IF

    totalBill = MINIMUM_CHARGE
    
    IF units == 0 THEN
        RETURN totalBill
    END IF

    // Calculate Slab Logic
    IF units <= 50 THEN
        totalBill = totalBill + (units * baseRate)
    ELSE IF units <= 100 THEN
        totalBill = totalBill + (50 * baseRate)
        totalBill = totalBill + ((units - 50) * (baseRate + 1))
    ELSE IF units <= 150 THEN
        totalBill = totalBill + (50 * baseRate)
        totalBill = totalBill + (50 * (baseRate + 1))
        totalBill = totalBill + ((units - 100) * (baseRate + 2))
    ELSE // Units > 150
        totalBill = totalBill + (50 * baseRate)
        totalBill = totalBill + (50 * (baseRate + 1))
        totalBill = totalBill + (50 * (baseRate + 2))
        // Remaining units charged at Max Rate (Single Slab)
        totalBill = totalBill + ((units - 150) * maxRate)
    END IF

    RETURN totalBill
END
```

## 2. Fine Calculation Algorithm

**Goal**: Calculate cumulative fine for overdue payments.

```pseudo
BEGIN calculateFine(dueDate, currentDate)
    CONSTANT FINE_PER_MONTH = 150
    
    IF currentDate <= dueDate THEN
        RETURN 0
    END IF
    
    diffInTime = currentDate - dueDate
    diffInDays = Floor(diffInTime / (1000 * 60 * 60 * 24))
    
    monthsLate = Ceil(diffInDays / 30)
    
    totalFine = monthsLate * FINE_PER_MONTH
    
    RETURN totalFine
END
```

## 3. Login Flowchart Logic

```pseudo
BEGIN Login(serviceNo, password)
    Find User in DB with serviceNo AND password
    
    IF User NOT Found THEN
        RETURN Error "Invalid Credentials"
    END IF
    
    IF User.role IS 'user' AND User.isApproved IS False THEN
        RETURN Error "Pending Approval"
    END IF
    
    Create Session(User)
    Log Login Time in Logs Table
    
    RETURN Success
END
```
