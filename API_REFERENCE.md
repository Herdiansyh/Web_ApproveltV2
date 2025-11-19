# API Reference - E-Approval System

**Last Updated:** November 19, 2025

## Base URL

```
http://localhost:8000
```

## Authentication

All authenticated endpoints require the user to be logged in (session-based). Use `@auth` middleware.

---

## 📋 Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Dashboard & Profile](#dashboard--profile)
3. [Submission Routes](#submission-routes)
4. [Document Routes](#document-routes)
5. [Workflow Routes](#workflow-routes)
6. [Division & Subdivision Routes](#division--subdivision-routes)
7. [User Management Routes](#user-management-routes)
8. [Response Formats](#response-formats)

---

## Authentication Routes

### Register User

**POST** `/register`

Create a new user account.

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "division_id": 1,
    "subdivision_id": 1
}
```

**Response:** `201 Created`

```json
{
    "message": "User created successfully",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "email_verified_at": null
    }
}
```

**Status Codes:**

-   `201` - User created, email verification sent
-   `422` - Validation error

---

### Login

**POST** `/login`

Authenticate user and create session.

**Request Body:**

```json
{
    "email": "user@example.com",
    "password": "password"
}
```

**Response:** `200 OK`

```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "division_id": 1,
        "subdivision_id": 1,
        "role": "user"
    }
}
```

**Status Codes:**

-   `200` - Login successful
-   `422` - Invalid credentials

---

### Logout

**POST** `/logout`

Destroy session and logout user.

**Response:** `200 OK`

```json
{
    "message": "Logged out successfully"
}
```

---

### Forgot Password

**POST** `/forgot-password`

Request password reset link via email.

**Request Body:**

```json
{
    "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
    "status": "We have emailed your password reset link!"
}
```

---

### Reset Password

**POST** `/reset-password`

Reset password using token from email link.

**Request Body:**

```json
{
    "token": "reset_token_from_email",
    "email": "user@example.com",
    "password": "new_password",
    "password_confirmation": "new_password"
}
```

**Response:** `200 OK`

```json
{
    "status": "Password has been reset!"
}
```

---

### Verify Email

**GET** `/verify/{token}`

Public endpoint to verify email address.

**URL Parameters:**

-   `token` - Email verification token (string)

**Response:** `200 OK` (redirects to dashboard if verified)

```html
<Redirect to="/dashboard" />
```

---

## Dashboard & Profile

### Get Dashboard

**GET** `/dashboard`

Requires authentication. Shows user dashboard with statistics.

**Response:** `200 OK`

```json
{
    "auth": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "division_id": 1,
            "division": {
                "id": 1,
                "name": "HR Division"
            }
        }
    },
    "stats": {
        "total_submission": 5,
        "waiting_approval": 2,
        "approved_submissions": 3,
        "rejected_submissions": 1
    },
    "pending_items": [
        {
            "id": 1,
            "title": "Leave Request",
            "current_step": 1,
            "status": "submitted",
            "created_at": "2025-11-19T10:00:00Z"
        }
    ]
}
```

---

### Get Profile

**GET** `/profile`

Get user profile page for editing.

**Response:** `200 OK` (Inertia Page)

```json
{
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "division_id": 1,
        "subdivision_id": 1
    },
    "mustVerifyEmail": false,
    "status": "updated"
}
```

---

### Update Profile

**PUT** `/profile`

Update user profile information.

**Request Body:**

```json
{
    "name": "John Doe Updated",
    "email": "john.updated@example.com"
}
```

**Response:** `200 OK`

```json
{
    "message": "Profile updated successfully",
    "user": {
        "id": 1,
        "name": "John Doe Updated",
        "email": "john.updated@example.com"
    }
}
```

---

### Update Password

**PUT** `/password`

Change user password.

**Request Body:**

```json
{
    "current_password": "old_password",
    "password": "new_password",
    "password_confirmation": "new_password"
}
```

**Response:** `200 OK`

```json
{
    "message": "Password updated successfully"
}
```

---

## Submission Routes

### List Submissions

**GET** `/submissions`

Get list of submissions (paginated).

**Query Parameters:**

-   `page` - Page number (default: 1)
-   `per_page` - Items per page (default: 15)
-   `status` - Filter by status (submitted, approved, rejected)
-   `search` - Search by title

**Response:** `200 OK`

```json
{
    "data": [
        {
            "id": 1,
            "title": "Leave Request",
            "description": "Annual leave for 5 days",
            "status": "submitted",
            "current_step": 1,
            "user_id": 1,
            "user": {
                "id": 1,
                "name": "John Doe"
            },
            "document_id": 1,
            "document": {
                "id": 1,
                "name": "Leave Request Form"
            },
            "workflow_id": 1,
            "workflow": {
                "id": 1,
                "name": "Standard Leave Workflow"
            },
            "created_at": "2025-11-19T10:00:00Z",
            "updated_at": "2025-11-19T10:00:00Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/submissions?page=1",
        "last": "http://localhost:8000/submissions?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 15,
        "to": 1,
        "total": 1
    }
}
```

---

### Create Submission

**POST** `/submissions`

Create new submission (starts as draft).

**Request Body:**

```json
{
    "document_id": 1,
    "workflow_id": 1,
    "title": "My Leave Request",
    "description": "Requesting 5 days leave",
    "data_json": {
        "leave_type": "annual",
        "start_date": "2025-12-01",
        "end_date": "2025-12-05",
        "reason": "Vacation"
    }
}
```

**Response:** `201 Created`

```json
{
    "message": "Submission created successfully",
    "submission": {
        "id": 1,
        "title": "My Leave Request",
        "status": "draft",
        "current_step": null,
        "user_id": 1,
        "created_at": "2025-11-19T10:00:00Z"
    }
}
```

---

### Get Submission Detail

**GET** `/submissions/{id}`

Get full details of a specific submission.

**URL Parameters:**

-   `id` - Submission ID (number)

**Response:** `200 OK`

```json
{
    "submission": {
        "id": 1,
        "title": "Leave Request",
        "description": "Annual leave",
        "status": "submitted",
        "current_step": 1,
        "user_id": 1,
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "division": {
                "id": 1,
                "name": "HR Division"
            }
        },
        "document_id": 1,
        "document": {
            "id": 1,
            "name": "Leave Request Form"
        },
        "workflow_id": 1,
        "workflow": {
            "id": 1,
            "name": "Standard Leave Workflow",
            "steps": [
                {
                    "id": 1,
                    "step_order": 1,
                    "name": "Manager Approval",
                    "division_id": 2,
                    "division": {
                        "id": 2,
                        "name": "Manager Division"
                    }
                },
                {
                    "id": 2,
                    "step_order": 2,
                    "name": "Director Approval",
                    "division_id": 3,
                    "division": {
                        "id": 3,
                        "name": "Director Division"
                    }
                }
            ]
        },
        "data_json": {
            "leave_type": "annual",
            "start_date": "2025-12-01",
            "end_date": "2025-12-05"
        },
        "approval_history": [
            {
                "id": 1,
                "step_order": 1,
                "status": "pending",
                "approver_id": null,
                "approval_note": null,
                "approved_at": null
            }
        ],
        "submission_files": [
            {
                "id": 1,
                "file_path": "submissions/file.pdf",
                "original_name": "attachment.pdf",
                "file_size": 102400
            }
        ],
        "created_at": "2025-11-19T10:00:00Z",
        "updated_at": "2025-11-19T10:00:00Z"
    }
}
```

---

### Update Submission (Draft Only)

**PUT** `/submissions/{id}`

Update submission data (only allowed if status is 'draft').

**URL Parameters:**

-   `id` - Submission ID (number)

**Request Body:**

```json
{
    "title": "Updated Leave Request",
    "description": "Updated description",
    "data_json": {
        "leave_type": "sick",
        "start_date": "2025-12-10",
        "end_date": "2025-12-12"
    }
}
```

**Response:** `200 OK`

```json
{
    "message": "Submission updated successfully",
    "submission": {
        "id": 1,
        "title": "Updated Leave Request",
        "updated_at": "2025-11-19T11:00:00Z"
    }
}
```

**Status Codes:**

-   `403` - Cannot update (not in draft status)

---

### Delete Submission (Draft Only)

**DELETE** `/submissions/{id}`

Delete submission (only allowed if status is 'draft').

**URL Parameters:**

-   `id` - Submission ID (number)

**Response:** `200 OK`

```json
{
    "message": "Submission deleted successfully"
}
```

---

### Submit Submission

**POST** `/submissions/{id}/submit`

Submit submission for approval (moves from draft to submitted).

**URL Parameters:**

-   `id` - Submission ID (number)

**Request Body:**

```json
{
    "workflow_id": 1,
    "notes": "Submitting for approval"
}
```

**Response:** `200 OK`

```json
{
    "message": "Submission submitted successfully",
    "submission": {
        "id": 1,
        "status": "submitted",
        "current_step": 1,
        "workflow_id": 1
    }
}
```

---

### Approve Submission

**POST** `/submissions/{id}/approve`

Approve submission at current step.

**URL Parameters:**

-   `id` - Submission ID (number)

**Request Body:**

```json
{
    "approval_note": "Approved by manager",
    "signature_image": "base64_encoded_image_data"
}
```

**Response:** `200 OK`

```json
{
    "message": "Submission approved successfully",
    "submission": {
        "id": 1,
        "status": "submitted",
        "current_step": 2,
        "updated_at": "2025-11-19T11:30:00Z"
    },
    "next_step": {
        "id": 2,
        "step_order": 2,
        "name": "Director Approval",
        "division": {
            "id": 3,
            "name": "Director Division"
        }
    }
}
```

**Status Codes:**

-   `200` - Approved successfully
-   `403` - Not authorized to approve

---

### Reject Submission

**POST** `/submissions/{id}/reject`

Reject submission at current step.

**URL Parameters:**

-   `id` - Submission ID (number)

**Request Body:**

```json
{
    "rejection_reason": "Need more information",
    "approval_note": "Rejected - please revise"
}
```

**Response:** `200 OK`

```json
{
    "message": "Submission rejected",
    "submission": {
        "id": 1,
        "status": "rejected",
        "current_step": 1,
        "rejection_reason": "Need more information"
    }
}
```

---

### Download PDF

**GET** `/submissions/{id}/pdf`

Download generated and stamped PDF.

**URL Parameters:**

-   `id` - Submission ID (number)

**Response:** `200 OK` (PDF file)

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="submission_1.pdf"
[Binary PDF data]
```

---

## Document Routes

### List Documents

**GET** `/documents`

Get all available document types.

**Response:** `200 OK`

```json
{
    "documents": [
        {
            "id": 1,
            "name": "Leave Request",
            "description": "Employee leave request form",
            "is_active": true,
            "fields": [
                {
                    "id": 1,
                    "name": "Leave Type",
                    "field_key": "leave_type",
                    "field_type": "select",
                    "is_required": true
                }
            ],
            "workflows": [
                {
                    "id": 1,
                    "name": "Standard Workflow"
                }
            ]
        }
    ]
}
```

---

### Create Document

**POST** `/documents`

Create new document type (admin only).

**Request Body:**

```json
{
    "name": "Travel Request",
    "description": "Employee travel request form"
}
```

**Response:** `201 Created`

```json
{
    "message": "Document created successfully",
    "document": {
        "id": 2,
        "name": "Travel Request",
        "description": "Employee travel request form"
    }
}
```

---

### Get Document

**GET** `/documents/{id}`

Get document details with fields.

**URL Parameters:**

-   `id` - Document ID (number)

**Response:** `200 OK`

```json
{
    "document": {
        "id": 1,
        "name": "Leave Request",
        "description": "Employee leave request form",
        "is_active": true,
        "fields": [
            {
                "id": 1,
                "name": "Leave Type",
                "field_key": "leave_type",
                "field_type": "select",
                "is_required": true,
                "options": ["annual", "sick", "unpaid"]
            },
            {
                "id": 2,
                "name": "Start Date",
                "field_key": "start_date",
                "field_type": "date",
                "is_required": true
            }
        ]
    }
}
```

---

### Update Document

**PUT** `/documents/{id}`

Update document (admin only).

**Request Body:**

```json
{
    "name": "Leave Request - Updated",
    "description": "Updated description"
}
```

**Response:** `200 OK`

```json
{
    "message": "Document updated successfully"
}
```

---

### Delete Document

**DELETE** `/documents/{id}`

Delete document (admin only).

**URL Parameters:**

-   `id` - Document ID (number)

**Response:** `200 OK`

```json
{
    "message": "Document deleted successfully"
}
```

---

## Workflow Routes

### List Workflows

**GET** `/workflows`

Get all workflows.

**Query Parameters:**

-   `document_id` - Filter by document
-   `is_active` - Filter by active status

**Response:** `200 OK`

```json
{
    "workflows": [
        {
            "id": 1,
            "name": "Standard Leave Workflow",
            "description": "Default leave approval workflow",
            "document_id": 1,
            "document": {
                "id": 1,
                "name": "Leave Request"
            },
            "is_active": true,
            "total_steps": 2,
            "steps": [
                {
                    "id": 1,
                    "step_order": 1,
                    "name": "Manager Approval",
                    "division_id": 2,
                    "division": {
                        "id": 2,
                        "name": "Manager"
                    }
                },
                {
                    "id": 2,
                    "step_order": 2,
                    "name": "Director Approval",
                    "division_id": 3,
                    "division": {
                        "id": 3,
                        "name": "Director"
                    }
                }
            ]
        }
    ]
}
```

---

### Create Workflow

**POST** `/workflows`

Create new workflow (admin only).

**Request Body:**

```json
{
    "name": "Emergency Leave Workflow",
    "description": "Quick approval for emergency leaves",
    "document_id": 1,
    "division_from_id": 1,
    "division_to_id": 3,
    "steps": [
        {
            "step_order": 1,
            "name": "Manager Approval",
            "division_id": 2,
            "can_edit": true,
            "can_delete": true
        },
        {
            "step_order": 2,
            "name": "Director Approval",
            "division_id": 3,
            "can_edit": false,
            "can_delete": false
        }
    ]
}
```

**Response:** `201 Created`

```json
{
    "message": "Workflow created successfully",
    "workflow": {
        "id": 2,
        "name": "Emergency Leave Workflow",
        "total_steps": 2
    }
}
```

---

### Get Workflow

**GET** `/workflows/{id}`

Get workflow details with steps.

**URL Parameters:**

-   `id` - Workflow ID (number)

**Response:** `200 OK`

```json
{
    "workflow": {
        "id": 1,
        "name": "Standard Leave Workflow",
        "description": "Default workflow",
        "document_id": 1,
        "is_active": true,
        "total_steps": 2,
        "steps": [
            {
                "id": 1,
                "step_order": 1,
                "name": "Manager Approval",
                "division_id": 2,
                "division": {
                    "id": 2,
                    "name": "Manager"
                },
                "permissions": [
                    {
                        "id": 1,
                        "subdivision_id": 5,
                        "subdivision": {
                            "id": 5,
                            "name": "HR Staff"
                        },
                        "can_approve": true,
                        "can_view": true,
                        "can_edit": true,
                        "can_delete": true
                    }
                ]
            }
        ]
    }
}
```

---

### Update Workflow

**PUT** `/workflows/{id}`

Update workflow (admin only).

**Request Body:**

```json
{
    "name": "Updated Workflow Name",
    "description": "Updated description",
    "is_active": true
}
```

**Response:** `200 OK`

```json
{
    "message": "Workflow updated successfully"
}
```

---

### Delete Workflow

**DELETE** `/workflows/{id}`

Delete workflow (admin only).

**URL Parameters:**

-   `id` - Workflow ID (number)

**Response:** `200 OK`

```json
{
    "message": "Workflow deleted successfully"
}
```

---

## Division & Subdivision Routes

### List Divisions

**GET** `/divisions`

Get all divisions (admin only).

**Response:** `200 OK`

```json
{
    "divisions": [
        {
            "id": 1,
            "name": "HR Division",
            "description": "Human Resources",
            "is_active": true,
            "subdivisions": [
                {
                    "id": 1,
                    "name": "HR Staff",
                    "description": "HR Department"
                },
                {
                    "id": 2,
                    "name": "HR Manager",
                    "description": "HR Management"
                }
            ]
        }
    ]
}
```

---

### Create Division

**POST** `/divisions`

Create new division (admin only).

**Request Body:**

```json
{
    "name": "Finance Division",
    "description": "Finance Department"
}
```

**Response:** `201 Created`

```json
{
    "message": "Division created successfully",
    "division": {
        "id": 4,
        "name": "Finance Division"
    }
}
```

---

### List Subdivisions

**GET** `/subdivisions`

Get all subdivisions (admin only).

**Query Parameters:**

-   `division_id` - Filter by division

**Response:** `200 OK`

```json
{
    "subdivisions": [
        {
            "id": 1,
            "name": "HR Staff",
            "division_id": 1,
            "division": {
                "id": 1,
                "name": "HR Division"
            },
            "is_active": true
        }
    ]
}
```

---

### Create Subdivision

**POST** `/subdivisions`

Create new subdivision (admin only).

**Request Body:**

```json
{
    "division_id": 1,
    "name": "HR Officer",
    "description": "HR Officer Position"
}
```

**Response:** `201 Created`

```json
{
    "message": "Subdivision created successfully",
    "subdivision": {
        "id": 5,
        "name": "HR Officer",
        "division_id": 1
    }
}
```

---

## User Management Routes

### List Users

**GET** `/users`

Get all users (admin only).

**Query Parameters:**

-   `division_id` - Filter by division
-   `search` - Search by name/email

**Response:** `200 OK`

```json
{
    "users": [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "division_id": 1,
            "division": {
                "id": 1,
                "name": "HR Division"
            },
            "subdivision_id": 1,
            "subdivision": {
                "id": 1,
                "name": "HR Staff"
            },
            "is_active": true,
            "created_at": "2025-11-01T00:00:00Z"
        }
    ]
}
```

---

### Create User

**POST** `/users`

Create new user (admin only).

**Request Body:**

```json
{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "division_id": 2,
    "subdivision_id": 3,
    "is_active": true
}
```

**Response:** `201 Created`

```json
{
    "message": "User created successfully",
    "user": {
        "id": 5,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "division_id": 2
    }
}
```

---

### Update User

**PUT** `/users/{id}`

Update user (admin only).

**Request Body:**

```json
{
    "name": "Jane Smith Updated",
    "division_id": 3,
    "subdivision_id": 5
}
```

**Response:** `200 OK`

```json
{
    "message": "User updated successfully"
}
```

---

## Response Formats

### Standard Success Response

```json
{
    "message": "Operation successful",
    "data": {
        "id": 1,
        "name": "Resource Name"
    }
}
```

### Standard Error Response

```json
{
    "message": "Error message",
    "errors": {
        "field_name": ["Error message for field"]
    }
}
```

### Validation Error Response (422)

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "name": ["The name must be at least 3 characters."]
    }
}
```

### Unauthorized Response (403)

```json
{
    "message": "This action is unauthorized.",
    "errors": {
        "policy": "You do not have permission to perform this action"
    }
}
```

### Not Found Response (404)

```json
{
    "message": "Resource not found"
}
```

---

## HTTP Status Codes

| Code  | Meaning                                 |
| ----- | --------------------------------------- |
| `200` | OK - Request successful                 |
| `201` | Created - Resource created              |
| `204` | No Content - Successful, no content     |
| `400` | Bad Request - Invalid request           |
| `401` | Unauthorized - Not authenticated        |
| `403` | Forbidden - Not authorized              |
| `404` | Not Found - Resource not found          |
| `422` | Unprocessable Entity - Validation error |
| `500` | Server Error                            |

---

## Common Query Parameters

| Parameter  | Description           | Example                    |
| ---------- | --------------------- | -------------------------- |
| `page`     | Pagination page       | `?page=2`                  |
| `per_page` | Items per page        | `?per_page=20`             |
| `sort`     | Sort field            | `?sort=created_at`         |
| `order`    | Sort order (asc/desc) | `?order=desc`              |
| `search`   | Search keyword        | `?search=leave`            |
| `filter`   | Filter criteria       | `?filter[status]=approved` |

---

**For more information, refer to `DOCUMENTATION.md`**
