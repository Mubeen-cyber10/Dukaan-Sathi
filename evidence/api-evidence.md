# API request and response evidence

Generated against a freshly seeded temporary database and the real Express server. Passwords and Authorization headers are redacted. JWTs show the first 20 characters only.

## Owner login

```json
{
  "request": {
    "method": "POST",
    "path": "/api/auth/login",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    "body": {
      "email": "shopowner@dukaansaathi.pk",
      "password": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": 2,
        "name": "Hamza Ali",
        "role": "owner",
        "shopId": 1
      }
    }
  }
}
```

## Admin login

```json
{
  "request": {
    "method": "POST",
    "path": "/api/auth/login",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    "body": {
      "email": "admin@dukaansaathi.pk",
      "password": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": 1,
        "name": "Sara Khan",
        "role": "admin",
        "shopId": null
      }
    }
  }
}
```

## Second owner login

```json
{
  "request": {
    "method": "POST",
    "path": "/api/auth/login",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    "body": {
      "email": "bilal@dukaansaathi.pk",
      "password": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": 3,
        "name": "Bilal Ahmed",
        "role": "owner",
        "shopId": 2
      }
    }
  }
}
```

## Valid owner token

```json
{
  "request": {
    "method": "GET",
    "path": "/api/auth/me",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "id": 2,
      "name": "Hamza Ali",
      "role": "owner",
      "shopId": 1
    }
  }
}
```

## Missing token

```json
{
  "request": {
    "method": "GET",
    "path": "/api/auth/me",
    "headers": {
      "Accept": "application/json"
    }
  },
  "response": {
    "status": 401,
    "body": {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
      }
    }
  }
}
```

## Tampered token

```json
{
  "request": {
    "method": "GET",
    "path": "/api/auth/me",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 401,
    "body": {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
      }
    }
  }
}
```

## Unsigned alg=none token

```json
{
  "request": {
    "method": "GET",
    "path": "/api/auth/me",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 401,
    "body": {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
      }
    }
  }
}
```

## Expired token

```json
{
  "request": {
    "method": "GET",
    "path": "/api/auth/me",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 401,
    "body": {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required"
      }
    }
  }
}
```

## Owner cannot approve shop

```json
{
  "request": {
    "method": "PATCH",
    "path": "/api/admin/shops/1/status",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]",
      "Content-Type": "application/json"
    },
    "body": {
      "status": "Active"
    }
  },
  "response": {
    "status": 403,
    "body": {
      "error": {
        "code": "FORBIDDEN",
        "message": "Access denied"
      }
    }
  }
}
```

## Admin cannot view khata

```json
{
  "request": {
    "method": "GET",
    "path": "/api/khata/customers",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 403,
    "body": {
      "error": {
        "code": "FORBIDDEN",
        "message": "Access denied"
      }
    }
  }
}
```

## Second owner customers

```json
{
  "request": {
    "method": "GET",
    "path": "/api/khata/customers",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": [
      {
        "id": 9,
        "name": "Amna Sheikh",
        "phone": "0300-***-**45",
        "createdAt": "2026-11-16T08:25:10.493Z",
        "balance": 730,
        "lastActivity": "2026-11-15T08:25:10.493Z"
      },
      {
        "id": 10,
        "name": "Haris Riaz",
        "phone": "0300-***-**46",
        "createdAt": "2026-11-16T08:25:10.493Z",
        "balance": 1825,
        "lastActivity": "2026-11-15T08:25:10.494Z"
      },
      {
        "id": 11,
        "name": "Mariam Abbas",
        "phone": "0300-***-**47",
        "createdAt": "2026-11-16T08:25:10.493Z",
        "balance": 3270,
        "lastActivity": "2026-11-15T08:25:10.494Z"
      },
      {
        "id": 12,
        "name": "Sami Ullah",
        "phone": "0300-***-**48",
        "createdAt": "2026-11-16T08:25:10.493Z",
        "balance": 1540,
        "lastActivity": "2026-11-15T08:25:10.494Z"
      }
    ]
  }
}
```

## Owner cannot see another ledger

```json
{
  "request": {
    "method": "GET",
    "path": "/api/khata/customers/9/entries",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 404,
    "body": {
      "error": {
        "code": "NOT_FOUND",
        "message": "Resource not found"
      }
    }
  }
}
```

## Invalid entry

```json
{
  "request": {
    "method": "POST",
    "path": "/api/khata/entries",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]",
      "Content-Type": "application/json"
    },
    "body": {
      "customerId": 1,
      "type": "credit",
      "amount": -5,
      "note": ""
    }
  },
  "response": {
    "status": 400,
    "body": {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Check the highlighted fields",
        "fields": {
          "amount": "Enter a whole number from 1 to 500000"
        }
      }
    }
  }
}
```

## SQL injection login

```json
{
  "request": {
    "method": "POST",
    "path": "/api/auth/login",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    "body": {
      "email": "' OR 1=1 --",
      "password": "[redacted]"
    }
  },
  "response": {
    "status": 401,
    "body": {
      "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "Invalid credentials"
      }
    }
  }
}
```

## Owner customers

```json
{
  "request": {
    "method": "GET",
    "path": "/api/khata/customers",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": [
      {
        "id": 1,
        "name": "Ahmed Raza",
        "phone": "0300-***-**45",
        "createdAt": "2026-11-16T08:25:10.205Z",
        "balance": 730,
        "lastActivity": "2026-11-15T08:25:10.205Z"
      },
      {
        "id": 2,
        "name": "Ayesha Malik",
        "phone": "0300-***-**46",
        "createdAt": "2026-11-16T08:25:10.205Z",
        "balance": 1825,
        "lastActivity": "2026-11-15T08:25:10.205Z"
      },
      {
        "id": 3,
        "name": "Usman Khan",
        "phone": "0300-***-**47",
        "createdAt": "2026-11-16T08:25:10.205Z",
        "balance": 3270,
        "lastActivity": "2026-11-15T08:25:10.206Z"
      },
      {
        "id": 4,
        "name": "Zainab Bibi",
        "phone": "0300-***-**48",
        "createdAt": "2026-11-16T08:25:10.205Z",
        "balance": 1540,
        "lastActivity": "2026-11-15T08:25:10.206Z"
      },
      {
        "id": 5,
        "name": "Bilal Tariq",
        "phone": "0300-***-**49",
        "createdAt": "2026-11-16T08:25:10.205Z",
        "balance": 3040,
        "lastActivity": "2026-11-15T08:25:10.206Z"
      },
      {
        "id": 6,
        "name": "Sadia Noor",
        "phone": "0300-***-**50",
        "createdAt": "2026-11-16T08:25:10.205Z",
        "balance": 4890,
        "lastActivity": "2026-11-15T08:25:10.206Z"
      },
      {
        "id": 7,
        "name": "Nadeem Iqbal",
        "phone": "0300-***-**51",
        "createdAt": "2026-11-16T08:25:10.206Z",
        "balance": 2350,
        "lastActivity": "2026-11-15T08:25:10.206Z"
      },
      {
        "id": 8,
        "name": "Hassan Ali",
        "phone": "0300-***-**52",
        "createdAt": "2026-11-16T08:25:10.206Z",
        "balance": 4255,
        "lastActivity": "2026-11-15T08:25:10.206Z"
      }
    ]
  }
}
```

## Add khata entry

```json
{
  "request": {
    "method": "POST",
    "path": "/api/khata/entries",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]",
      "Content-Type": "application/json"
    },
    "body": {
      "customerId": 1,
      "type": "credit",
      "amount": 125,
      "note": "Evidence purchase"
    }
  },
  "response": {
    "status": 201,
    "body": {
      "entry": {
        "id": 47,
        "customerId": 1,
        "type": "credit",
        "amount": 125,
        "note": "Evidence purchase",
        "createdAt": "2026-11-16T08:25:13.471Z",
        "runningBalance": 855
      },
      "balance": 855
    }
  }
}
```

## Retrieve stored entry

```json
{
  "request": {
    "method": "GET",
    "path": "/api/khata/customers/1/entries",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "entries": [
        {
          "id": 1,
          "customerId": 1,
          "type": "credit",
          "amount": 450,
          "note": "Store purchase",
          "createdAt": "2026-11-13T08:25:10.205Z",
          "runningBalance": 450
        },
        {
          "id": 2,
          "customerId": 1,
          "type": "credit",
          "amount": 530,
          "note": "Store purchase",
          "createdAt": "2026-11-14T08:25:10.205Z",
          "runningBalance": 980
        },
        {
          "id": 3,
          "customerId": 1,
          "type": "payment",
          "amount": 250,
          "note": "Cash received",
          "createdAt": "2026-11-15T08:25:10.205Z",
          "runningBalance": 730
        },
        {
          "id": 47,
          "customerId": 1,
          "type": "credit",
          "amount": 125,
          "note": "Evidence purchase",
          "createdAt": "2026-11-16T08:25:13.471Z",
          "runningBalance": 855
        }
      ],
      "balance": 855
    }
  }
}
```

## Register pending shop

```json
{
  "request": {
    "method": "POST",
    "path": "/api/shops/register",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    "body": {
      "ownerName": "Evidence Owner",
      "email": "evidence@example.test",
      "mobile": "03001234567",
      "shopName": "Evidence Bazaar",
      "category": "General Store",
      "city": "Multan",
      "address": "12 Main Bazaar",
      "description": "Submission evidence",
      "password": "[redacted]"
    }
  },
  "response": {
    "status": 201,
    "body": {
      "shopId": 9,
      "status": "Pending"
    }
  }
}
```

## Pending shop hidden from public

```json
{
  "request": {
    "method": "GET",
    "path": "/api/shops/public?q=Evidence%20Bazaar",
    "headers": {
      "Accept": "application/json"
    }
  },
  "response": {
    "status": 200,
    "body": []
  }
}
```

## Admin queue API

```json
{
  "request": {
    "method": "GET",
    "path": "/api/admin/shops?status=Pending",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]"
    }
  },
  "response": {
    "status": 200,
    "body": [
      {
        "id": 9,
        "name": "Evidence Bazaar",
        "category": "General Store",
        "city": "Multan",
        "address": "12 Main Bazaar",
        "description": "Submission evidence",
        "status": "Pending",
        "reject_reason": null,
        "created_at": "2026-11-16T08:25:13.792Z",
        "owner_name": "Evidence Owner",
        "owner_phone": "0300-***-**67"
      },
      {
        "id": 8,
        "name": "Chenab Market",
        "category": "General Store",
        "city": "Faisalabad",
        "address": "Shop 8, Main Bazaar",
        "description": "Local shop serving Faisalabad.",
        "status": "Pending",
        "reject_reason": null,
        "created_at": "2026-11-16T08:25:12.109Z",
        "owner_name": "Tariq Noor",
        "owner_phone": "0300-***-**67"
      },
      {
        "id": 4,
        "name": "Iqbal Electronics",
        "category": "Electronics",
        "city": "Karachi",
        "address": "Shop 4, Main Bazaar",
        "description": "Local shop serving Karachi.",
        "status": "Pending",
        "reject_reason": null,
        "created_at": "2026-11-16T08:25:11.028Z",
        "owner_name": "Ali Tariq",
        "owner_phone": "0300-***-**63"
      }
    ]
  }
}
```

## Admin approves shop

```json
{
  "request": {
    "method": "PATCH",
    "path": "/api/admin/shops/9/status",
    "headers": {
      "Accept": "application/json",
      "Authorization": "[redacted]",
      "Content-Type": "application/json"
    },
    "body": {
      "status": "Active"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "shopId": 9,
      "status": "Active"
    }
  }
}
```

## Approved shop visible publicly

```json
{
  "request": {
    "method": "GET",
    "path": "/api/shops/public?q=Evidence%20Bazaar",
    "headers": {
      "Accept": "application/json"
    }
  },
  "response": {
    "status": 200,
    "body": [
      {
        "id": 9,
        "name": "Evidence Bazaar",
        "category": "General Store",
        "city": "Multan",
        "address": "12 Main Bazaar",
        "description": "Submission evidence",
        "public_phone": null
      }
    ]
  }
}
```
