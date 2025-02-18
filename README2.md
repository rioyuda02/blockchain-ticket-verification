# KittyCare Server API Documentation

Welcome to the KittyCare Server API documentation! This guide is designed to help frontend developers integrate seamlessly with the KittyCare backend. Below, you'll find detailed information about available endpoints, authentication, request/response structures, and best practices to ensure smooth communication between your frontend application and the server.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
    - [Authentication Routes](#authentication-routes)
    - [Subscription Routes](#subscription-routes)
    - [Cat Management Routes](#cat-management-routes)
    - [Chat Routes](#chat-routes)
    - [OpenAI Routes](#openai-routes)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Environment Variables](#environment-variables)

---

## Overview

The KittyCare server is built using Node.js and Express, leveraging Supabase for database management and OpenAI for AI-driven features. The server exposes a RESTful API that handles user authentication, subscription management, cat profiles, and chat functionalities. All protected routes require JWT-based authentication to ensure secure access.

## Authentication

Authentication is handled using JSON Web Tokens (JWT). Users must authenticate via the signup or signin routes to receive a token, which must be included in the `Authorization` header for protected routes.

### Obtaining a JWT Token

- **Sign Up**: Create a new user account.
- **Sign In**: Authenticate an existing user.

### Using the JWT Token

Include the token in the `Authorization` header for all protected API requests:

```
Authorization: Bearer <your_jwt_token>
```

**Note**: Replace `<your_jwt_token>` with the actual token received upon successful signup or signin.

---

## API Endpoints

All endpoints are prefixed with either `/api/openai` or `/api/supabase`.

### Authentication Routes

#### 1. Sign Up

- **Endpoint**: `POST /api/supabase/signup`
- **Description**: Registers a new user and returns an authentication token.
- **Authentication**: **None**
- **Request Body**:

    ```json
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "password": "StrongPassword@123",
      "phone_number": "1234567890",
    }
    ```

- **Validation Rules**:
  - `first_name`: Required, string.
  - `last_name`: Required, string.
  - `email`: Required, must be a valid email format.
  - `password`: Required, minimum 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (`@$!%*?&`).
  - `phone_number`: Optional, string.

- **Responses**:
  - **201 Created**:

    ```json
    {
      "token": "<JWT Token>",
      "expiresIn": "1d"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "First name cannot be empty",
        "Invalid email format",
        "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)",
      ]
    }
    ```

  - **409 Conflict**:

    ```json
    {
      "error": "Email already in use"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An unexpected error occurred"
    }
    ```

#### 2. Sign In

- **Endpoint**: `POST /api/supabase/signin`
- **Description**: Authenticates a user and returns an authentication token.
- **Authentication**: **None**
- **Request Body**:

    ```json
    {
      "email": "john.doe@example.com",
      "password": "StrongPassword@123"
    }
    ```

- **Validation Rules**:
  - `email`: Required, must be a valid email format.
  - `password`: Required.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "token": "<JWT Token>",
      "expiresIn": "1d"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "Invalid email format",
        "Password is required"
      ]
    }
    ```

  - **401 Unauthorized**:

    ```json
    {
      "error": "User not found" // or "Incorrect password"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred during signin"
    }
    ```

### Subscription Routes

**Note**: All subscription routes require authentication.

#### 1. Get Subscription

- **Endpoint**: `GET /api/supabase/subscriptions`
- **Description**: Retrieves the current user's subscription details.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Responses**:
  - **200 OK**:

    ```json
    {
      "id": 1,
      "plan": "Basic",
      "end_date": "2023-12-31",
      "start_date": "2023-01-01",
      "provider": "PayPal",
      "billing_period": "Monthly"
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "message": "No subscription found for this user."
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while fetching the subscription"
    }
    ```

#### 2. Create Subscription

- **Endpoint**: `POST /api/supabase/subscriptions`
- **Description**: Creates a new subscription for the user.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Request Body**:

    ```json
    {
      "plan": "Basic",
      "end_date": "2023-12-31",
      "start_date": "2023-01-01",
      "provider": "PayPal",
      "billing_period": "Monthly"
    }
    ```

- **Validation Rules**:
  - `plan`: Required, must be one of the predefined plans (`Basic`, `Premium`).
  - `end_date`: Required, must be a valid ISO 8601 date in the future.
  - `start_date`: Required, must be a valid ISO 8601 date in the future.

- **Responses**:
  - **201 Created**:

    ```json
    {
      "id": 1,
      "user_id": 1,
      "plan": "Basic",
      "end_date": "2023-12-31",
      "start_date": "2023-01-01",
      "provider": "PayPal",
      "billing_period": "Monthly"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "error": "User already has a subscription"
    }
    ```

    Or validation errors:

    ```json
    {
      "errors": [
        "Plan is required",
        "Plan must be one of: Basic, Premium",
        "End date must be in the future",
        "Start date must be in the future",
        "Provider is required",
        "Provider must be either PayPal or Stripe",
        "Billing period is required",
        "Billing period must be either Monthly or Yearly"
      ]
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while creating the subscription"
    }
    ```

#### 3. Update Subscription

- **Endpoint**: `PUT /api/supabase/subscriptions/:id`
- **Description**: Updates the user's subscription details.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Path Parameters**:
  - `id`: Subscription ID.

- **Request Body**:

    ```json
    {
      "plan": "Premium",
      "end_date": "2024-12-31",
      "start_date": "2024-01-01",
      "provider": "PayPal",
      "billing_period": "Monthly"
    }
    ```

- **Validation Rules**:
  - At least one of `plan` or `end_date` must be provided.
  - `plan`: If provided, must be one of the predefined plans (`Basic`, `Premium`).
  - `end_date`: If provided, must be a valid ISO 8601 date in the future.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "id": 1,
      "user_id": 1,
      "plan": "Premium",
      "end_date": "2024-12-31",
      "start_date": "2024-01-01",
      "provider": "PayPal",
      "billing_period": "Monthly"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "At least one of plan or end_date must be provided",
        "Plan must be one of: Basic, Premium",
        "End date must be in the future",
        "Start date must be in the future",
        "Provider is required",
        "Provider must be either PayPal or Stripe",
        "Billing period is required",
        "Billing period must be either Monthly or Yearly"
      ]
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Subscription not found or user not authorized"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while updating the subscription"
    }
    ```

#### 4. Delete Subscription

- **Endpoint**: `DELETE /api/supabase/subscriptions/:id`
- **Description**: Deletes the user's subscription.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Path Parameters**:
  - `id`: Subscription ID.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "message": "Subscription successfully deleted"
    }
    ```

  - **403 Forbidden**:

    ```json
    {
      "error": "User not authorized to delete this subscription"
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Subscription not found"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while deleting the subscription"
    }
    ```

### Cat Management Routes

**Note**: All cat management routes require authentication.

#### 1. Get All Cats

- **Endpoint**: `GET /api/supabase/cats`
- **Description**: Retrieves all cats associated with the authenticated user.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Responses**:
  - **200 OK**:

    ```json
    [
      {
        "id": 1,
        "name": "Whiskers",
        "age": 2
      },
      {
        "id": 2,
        "name": "Fluffy",
        "age": 3
      }
    ]
    ```

  - **404 Not Found**:

    ```json
    {
      "message": "No cats found for this user."
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while fetching the cats"
    }
    ```

#### 2. Create a New Cat

- **Endpoint**: `POST /api/supabase/cats`
- **Description**: Creates a new cat profile for the authenticated user.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Request Body**:

    ```json
    {
      "name": "Whiskers",
      "goal": "Weight Management",
      "photo": "base64_encoded_string",
      "issues_faced": "None",
      "activity_level": "Active",
      "gender": "Male",
      "age": 2,
      "country": "USA",
      "zipcode": "12345",
      "breed": "Siamese",
      "weight": 10.5,
      "target_weight": 9.0,
      "required_progress": "Hourly updates",
      "check_in_period": "Weekly",
      "training_days": "Monday, Wednesday, Friday",
      "medical_conditions": "",
      "medications": "",
      "dietary_restrictions": "",
      "medical_history": "",
      "items": ""
    }
    ```

- **Validation Rules**:
  - `name`: Required, string.
  - `goal`: Required, string.
  - `photo`: Optional, string (base64 encoded).
  - `issues_faced`: Optional, string.
  - `activity_level`: Required, string.
  - `gender`: Required, must be either "Male" or "Female".
  - `age`: Required, must be an integer.
  - `country`: Required, string.
  - `zipcode`: Required, string.
  - `breed`: Required, string.
  - `weight`: Required, must be a positive number.
  - `target_weight`: Required, must be a positive number.
  - `required_progress`: Required, string.
  - `check_in_period`: Required, must be one of: "Daily", "Weekly", "Bi-weekly", "Monthly".
  - `training_days`: Required, string.
  - `medical_conditions`: Optional, string.
  - `medications`: Optional, string.
  - `dietary_restrictions`: Optional, string.
  - `medical_history`: Optional, string.
  - `items`: Optional, string.

- **Responses**:
  - **201 Created**:

    ```json
    {
      "id": 1,
      "name": "Whiskers",
      "goal": "Weight Management",
      "issues_faced": "None",
      "activity_level": "Active",
      "gender": "Male",
      "age": 2,
      "country": "USA",
      "zipcode": "12345",
      "breed": "Siamese",
      "weight": 10.5,
      "target_weight": 9.0,
      "required_progress": "Hourly updates",
      "check_in_period": "Weekly",
      "training_days": "Monday, Wednesday, Friday",
      "medical_conditions": "",
      "medications": "",
      "dietary_restrictions": "",
      "medical_history": "",
      "items": "",
      "food_bowls": "Automatic",
      "treats": "Organic",
      "playtime": "30 minutes daily"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "Name is required",
        "Goal is required",
        "Gender must be either Male or Female",
        "Age must be a number",
        "Age must be an integer",
        "Country is required",
        "Zipcode is required",
        "Breed is required",
        "Weight must be a positive number",
        "Target weight must be a positive number",
        "Required progress is required",
        "Check-in period must be one of: Daily, Weekly, Bi-weekly, Monthly",
        "Training days is required"
      ]
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while creating the cat"
    }
    ```

#### 3. Update a Cat

- **Endpoint**: `PUT /api/supabase/cats/:id`
- **Description**: Updates an existing cat's information.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Path Parameters**:
  - `id`: Cat ID.

- **Request Body**:

    ```json
    {
      "weight": 9.5,
      "target_weight": 9.0
    }
    ```

- **Validation Rules**:
  - At least one of the following fields must be provided:
    - `name`, `goal`, `issues_faced`, `activity_level`, `gender`, `age`, `country`, `zipcode`, `breed`, `weight`, `target_weight`, `required_progress`, `check_in_period`, `training_days`, `medical_conditions`, `medications`, `dietary_restrictions`, `medical_history`, `items`.
  - If provided:
    - `gender`: Must be either `Male` or `Female`.
    - `age`: Must be an integer.
    - `weight` and `target_weight`: Must be positive numbers.
    - `check_in_period`: Must be one of `Daily`, `Weekly`, `Bi-weekly`, `Monthly`.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "id": 1,
      "name": "Whiskers",
      "goal": "Weight Management",
      "issues_faced": "None",
      "activity_level": "Active",
      "gender": "Male",
      "age": 2,
      "country": "USA",
      "zipcode": "12345",
      "breed": "Siamese",
      "weight": 9.5,
      "target_weight": 9.0,
      "required_progress": "Hourly updates",
      "check_in_period": "Weekly",
      "training_days": "Monday, Wednesday, Friday",
      "medical_conditions": "",
      "medications": "",
      "dietary_restrictions": "",
      "medical_history": "",
      "items": "",
      "food_bowls": "Automatic",
      "treats": "Organic",
      "playtime": "30 minutes daily"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "At least one of plan or end_date must be provided",
        "Plan must be one of: Basic, Premium",
        "End date must be in the future",
        "Gender must be either Male or Female",
        "Age must be a number",
        "Age must be an integer",
        "Weight must be a positive number",
        "Target weight must be a positive number",
        "Check-in period must be one of: Daily, Weekly, Bi-weekly, Monthly"
      ]
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Cat not found or user not authorized"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while updating the cat"
    }
    ```

#### 4. Delete a Cat

- **Endpoint**: `DELETE /api/supabase/cats/:id`
- **Description**: Deletes a cat profile.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Path Parameters**:
  - `id`: Cat ID.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "message": "Cat deleted successfully"
    }
    ```

  - **403 Forbidden**:

    ```json
    {
      "error": "User not authorized to delete this cat"
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Cat not found"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while deleting the cat"
    }
    ```

### Chat Routes

**Note**: All chat routes require authentication.

#### 1. Get Conversations

- **Endpoint**: `GET /api/supabase/conversations`
- **Description**: Retrieves all conversations for the authenticated user.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Query Parameters**:
  - `conversationId` (optional): If provided, returns details for a specific conversation.

- **Responses**:
  - **200 OK**:

    ```json
    [
      {
        "id": 1,
        "user_id": 36,
        "started_at": "2023-06-01T12:00:00Z",
        "messages": [
          {
            "content": "Hello",
            "role": "user",
            "timestamp": "2023-06-01T12:00:00Z"
          },
          {
            "content": "Hi there!",
            "role": "assistant",
            "timestamp": "2023-06-01T12:01:00Z"
          }
        ]
      },
      {
        "id": 2,
        "user_id": 36,
        "started_at": "2023-06-02T14:00:00Z",
        "messages": []
      }
    ]
    ```

  - **404 Not Found**:

    ```json
    {
      "message": "No conversations found for this user."
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while fetching the conversations"
    }
    ```

#### 2. Create a New Conversation

- **Endpoint**: `POST /api/supabase/conversations`
- **Description**: Creates a new conversation for the authenticated user.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Responses**:
  - **201 Created**:

    ```json
    {
      "conversation_id": 1
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while creating the conversation"
    }
    ```

#### 3. Update a Conversation

- **Endpoint**: `PUT /api/supabase/conversations/:id`
- **Description**: Updates an existing conversation.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Path Parameters**:
  - `id`: Conversation ID.

- **Request Body**:

    ```json
    {
      "started_at": "2023-06-01T13:00:00Z",
      "messages": [
        {
          "role": "user",
          "content": "Hello, how are you?"
        }
      ]
    }
    ```

- **Validation Rules**:
  - `messages`: Required, non-empty array of objects with:
    - `role`: Required, either `user` or `assistant`.
    - `content`: Required, string.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "success": true,
      "message": "Conversation updated successfully"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "Messages must be a non-empty array",
        "Role must be one of: user, assistant",
        "Content is required"
      ]
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Conversation not found"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while updating the conversation"
    }
    ```

#### 4. Delete a Conversation

- **Endpoint**: `DELETE /api/supabase/conversations/:id`
- **Description**: Deletes a specific conversation.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Path Parameters**:
  - `id`: Conversation ID.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "message": "Conversation deleted successfully"
    }
    ```

  - **403 Forbidden**:

    ```json
    {
      "error": "User not authorized to delete this conversation"
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Conversation not found"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while deleting the conversation"
    }
    ```

#### 5. Post Chat Message

- **Endpoint**: `POST /api/supabase/chat`
- **Description**: Adds a new message to a conversation.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Request Body**:

    ```json
    {
      "conversation_id": 1,
      "content": "Hello, how are you?",
      "role": "user"
    }
    ```

- **Validation Rules**:
  - `conversation_id`: Required, integer.
  - `content`: Required, string.
  - `role`: Required, must be either "user" or "assistant".

- **Responses**:
  - **201 Created**:

    ```json
    {
      "conversation_id": 1,
      "message": {
        "id": 2,
        "conversation_id": 1,
        "user_id": 36,
        "content": "Hello, how are you?",
        "role": "user"
      }
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "error": "Invalid input" // or other validation errors
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "User not found"
    }
    ```

    Or:

    ```json
    {
      "error": "Conversation not found"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while processing the chat message"
    }
    ```

---

### OpenAI Routes

**Note**: All OpenAI routes require authentication.

#### 1. Chat with OpenAI

- **Endpoint**: `POST /api/openai/chat`
- **Description**: Sends messages to OpenAI for generating responses based on a specific cat's details.
- **Authentication**: **Required**
- **Request Headers**:

    ```
    Authorization: Bearer <JWT Token>
    ```

- **Request Body**:

    ```json
    {
      "catId": 1,
      "messages": [
        {
          "role": "user",
          "content": "Hello"
        }
      ]
    }
    ```

- **Validation Rules**:
  - `catId`: Required, integer.
  - `messages`: Required, non-empty array of objects with:
    - `role`: Required, either `user` or `assistant`.
    - `content`: Required, string.

- **Responses**:
  - **200 OK**:

    ```json
    {
      "message": "OpenAI response"
    }
    ```

  - **400 Bad Request**:

    ```json
    {
      "errors": [
        "Messages must be a non-empty array",
        "catId must be a number",
        "role must be one of [user, assistant]"
      ]
    }
    ```

  - **401 Unauthorized**:

    ```json
    {
      "error": "Authentication token is missing"
    }
    ```

  - **404 Not Found**:

    ```json
    {
      "error": "Cat not found"
    }
    ```

  - **500 Internal Server Error**:

    ```json
    {
      "error": "An error occurred while processing the request"
    }
    ```

---

## Data Models

### User

- **Fields**:
  - `id` (integer): Unique identifier.
  - `first_name` (string): User's first name.
  - `last_name` (string): User's last name.
  - `email` (string): User's email address.
  - `password` (string): Hashed password.

### Subscription

- **Fields**:
  - `id` (integer): Unique identifier.
  - `user_id` (integer): Reference to the User.
  - `plan` (string): Subscription plan (`Basic`, `Premium`).
  - `end_date` (ISO 8601 date): Subscription end date.

### Cat

- **Fields**:
  - `id` (integer): Unique identifier.
  - `user_id` (integer): Reference to the User.
  - `name` (string): Cat's name.
  - `goal` (string): Goal for the cat (e.g., Weight Management).
  - `issues_faced` (string): Any issues faced by the cat.
  - `activity_level` (string): Activity level (`Active`, etc.).
  - `gender` (string): `Male` or `Female`.
  - `age` (integer): Age in years.
  - `country` (string): Country of residence.
  - `zipcode` (string): Zip code.
  - `breed` (string): Breed of the cat.
  - `weight` (number): Current weight.
  - `target_weight` (number): Target weight.
  - `required_progress` (string): Required progress updates.
  - `check_in_period` (string): `Daily`, `Weekly`, `Bi-weekly`, `Monthly`.
  - `training_days` (string): Days of training.
  - `medical_conditions` (string): Any medical conditions.
  - `medications` (string): Medications.
  - `dietary_restrictions` (string): Dietary restrictions.
  - `medical_history` (string): Surgery history.
  - `items` (string): Items.
  - **AI Recommendations**:
    - `food_bowls` (string)
    - `treats` (string)
    - `playtime` (string)

### Conversation

- **Fields**:
  - `id` (integer): Unique identifier.
  - `user_id` (integer): Reference to the User.
  - `started_at` (ISO 8601 date): Timestamp when the conversation started.
  - `messages` (array of Message): List of messages in the conversation.

### Message

- **Fields**:
  - `id` (integer): Unique identifier.
  - `conversation_id` (integer): Reference to the Conversation.
  - `user_id` (integer): Reference to the User.
  - `content` (string): Content of the message.
  - `role` (string): `user` or `assistant`.
  - `timestamp` (ISO 8601 date): When the message was sent.

---

## Error Handling

The server follows standard HTTP status codes to indicate the outcome of API requests:

- **200 OK**: The request was successful.
- **201 Created**: A new resource was successfully created.
- **400 Bad Request**: The request was invalid or cannot be otherwise served. Likely due to validation errors.
- **401 Unauthorized**: Authentication is required and has failed or has not yet been provided.
- **403 Forbidden**: The request was valid, but the server is refusing action. The user might not have the necessary permissions.
- **404 Not Found**: The requested resource could not be found.
- **409 Conflict**: Indicates a conflict with the current state of the resource, such as duplicate entries.
- **500 Internal Server Error**: A generic error message when the server encounters an unexpected condition.

**Error Response Structure**:

```json
{
  "error": "Error message here"
}
```

Or for multiple errors:

```json
{
  "errors": [
    "First error message",
    "Second error message"
  ]
}
```

---

## Best Practices

1. **Authentication**:
   - Always include the `Authorization` header with a valid JWT token for protected routes.
   - Store the JWT token securely on the frontend, preferably in HTTP-only cookies to prevent XSS attacks.

2. **Handling Responses**:
   - Check for HTTP status codes to determine the success or failure of API requests.
   - Implement proper error handling based on the error messages and status codes returned by the server.

3. **Validation**:
   - Ensure that all required fields are provided and correctly formatted before making API requests.
   - Utilize frontend validation to provide immediate feedback to users, reducing unnecessary API calls.

4. **Security**:
   - Never expose sensitive information in error messages.
   - Implement rate limiting on the server to prevent brute-force attacks (if not already handled).

5. **Optimizing API Calls**:
   - Batch requests when possible to reduce the number of HTTP requests.
   - Cache frequently accessed data on the frontend to minimize redundant API calls.

6. **Using AI Features**:
   - When integrating chat features with OpenAI, ensure that messages are formatted correctly and handle AI responses appropriately.

---

## Environment Variables

Ensure that the following environment variables are correctly set in your frontend environment to interact with the server:

- **Authentication**:
  - No frontend-specific environment variables needed, but securely handle the JWT token.

- **API Base URLs**:
  - If the server is deployed, replace `http://localhost:3000` with the actual server URL.

**Example**:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
```

Use this base URL to prefix all API endpoint paths in your frontend application.

---

## Summary of Available Plans

The server currently supports the following subscription plans:

- **Basic**: Suitable for users with standard needs.
- **Premium**: Offers enhanced features and support.

**Note**: Ensure that when creating or updating subscriptions, the `plan` field matches one of these predefined values.

---

## Contact & Support

If you encounter any issues or have questions regarding the API, please reach out via the [GitHub Issues](https://github.com/SundustAI/kittycare-nodejs/issues) page of the repository.

---

Happy Coding! 🐱🚀

### OTP Authentication Endpoints

#### Sign In with OTP
- **Endpoint**: `POST /api/supabase/signin-otp`
- **Description**: Sends a one-time password to the user's email
- **Request Body**:  ```json
  {
    "email": "user@example.com"
  }  ```

#### Verify OTP
- **Endpoint**: `POST /api/supabase/verify-otp`
- **Description**: Verifies the OTP and returns a session
- **Request Body**:  ```json
  {
    "email": "user@example.com",
    "token": "123456",
    "type": "email"
  }  ```

#### Sign Up with OTP
- **Endpoint**: `POST /api/supabase/signup-otp`
- **Description**: Creates a new user and sends OTP
- **Request Body**:  ```json
  {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "1234567890" // optional
  }  ```
