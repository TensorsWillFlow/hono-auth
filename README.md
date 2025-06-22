# Hono & Drizzle API Backend

This project is a secure and robust backend API built with [Hono](https://hono.dev/) on Node.js, using [Drizzle ORM](https://orm.drizzle.team/) for database interactions with a PostgreSQL database. It includes a complete JWT-based authentication system with refresh tokens and a session table for enhanced security.

## Features

- **Fast & Lightweight:** Built with Hono, one of the fastest web frameworks for JavaScript.
- **Type-Safe Database:** Drizzle ORM provides a fully type-safe SQL-like query builder.
- **Secure Authentication:** Implements a modern hybrid authentication strategy.
  - Short-lived JWT Access Tokens (15 minutes).
  - Long-lived, database-backed Refresh Tokens for persistent sessions.
- **Database Migrations:** Drizzle Kit handles all database schema migrations.
- **Ready for Production:** Includes scripts for running in development, production, and debugging.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database

## Getting Started

### 1. Clone & Install Dependencies

Clone the repository and install the required npm packages.

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example.

```bash
cp .env.example .env
```

Now, open the `.env` file and configure your variables:

- `DATABASE_URL`: Your full PostgreSQL connection string.
- `FRONTEND_URL`: The URL of your frontend application (e.g., `http://localhost:5173`).
- `ACCESS_TOKEN_SECRET`: A long, random, secret string for signing access tokens.
- `REFRESH_TOKEN_SECRET`: A different long, random, secret string for signing refresh tokens.

You can do this via console with node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```

### 3. Run Database Migrations

With your database running and the `.env` file configured, apply the database migrations to set up your tables.

```bash
npm run db:push
```

## Running the Application

- **Development Mode:** Starts the server with hot-reloading.

  ```bash
  npm run dev
  ```

- **Production Mode:** Starts the server in a standard Node.js process.

  ```bash
  npm start
  ```

- **Debugging Mode (VS Code):**
  1.  Make sure the `dev` server is **not** running.
  2.  Set breakpoints directly in your code.
  3.  Go to the "Run and Debug" panel in VS Code.
  4.  Select "Debug Hono App" from the dropdown and click the play button.

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication (`/auth`)

- `POST /auth/register`

  - Creates a new user.
  - **Body:** `{ "username": "string", "email": "string", "password": "string" }`

- `POST /auth/login`

  - Logs in a user and returns tokens.
  - **Body:** `{ "email": "string", "password": "string" }`
  - **Returns:** `{ user, accessToken, refreshToken }`

- `POST /auth/refresh`

  - Generates a new access token using a valid refresh token.
  - **Body:** `{ "refreshToken": "string" }`
  - **Returns:** `{ accessToken }`

- `POST /auth/logout`
  - Invalidates a session by deleting the refresh token from the database.
  - **Body:** `{ "refreshToken": "string" }`

### Users (`/users`)

- `GET /users/me`
  - **Protected:** Requires a valid `accessToken`.
  - Fetches the profile of the currently authenticated user.
  - **Headers:** `Authorization: Bearer <accessToken>`
  - **Returns:** `{ user }`

## Authentication Flow Explained

This application uses a hybrid token-based authentication system for a balance of performance and security.

1.  **Login:** When you log in, the server gives you two tokens: a short-lived `accessToken` and a long-lived `refreshToken`. The refresh token is stored in the `sessions` table in the database.
2.  **API Requests:** For most requests, you send the `accessToken` in the `Authorization` header. The server quickly verifies this token without needing to check the database.
3.  **Token Expiration:** When the `accessToken` expires (after 15 minutes), your application uses the `refreshToken` to request a new `accessToken` from the `/auth/refresh` endpoint.
4.  **Logout:** When you log out, the server deletes the `refreshToken` from the database. This effectively invalidates the session, and the token can no longer be used to get new access tokens.
