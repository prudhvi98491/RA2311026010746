# Notification System Design

## Overview
This repository contains the frontend track deliverable for the AffordMed campus notifications challenge.

- `logging_middleware/`: reusable frontend logging module for sending structured logs to the test server.
- `notification_app_be/`: placeholder backend folder included to satisfy the frontend track repository structure.
- `notification_app_fe/`: React application for fetching and rendering notifications from the protected notifications API.

## Architecture

### Frontend Application
- Built with React and Vite for a fast local development experience.
- Uses browser `fetch` to call the protected notifications API.
- Supports query parameters: `limit`, `page`, and `notification_type`.
- Distinguishes between new and viewed notifications using `localStorage`.
- Provides both a `Priority Inbox` and `All Notifications` view.
- Includes an authorization token manager to set the bearer token required for protected routes.
- Implements the image-based problem statement with an efficient notification priority strategy, filter controls, and responsive UI.

### Logging Middleware
- Implemented as a reusable JavaScript package in `logging_middleware/`.
- Exposes a single function: `log(stack, level, package, message, authToken)`.
- Sends logs to `http://20.207.122.201/evaluation-service/logs`.
- Designed to be integrated into frontend app behavior and API events.

## Notification App Behavior

### Priority Inbox
- Ranks unread notifications by severity weight:
  - `Placement` (highest)
  - `Result`
  - `Event`
- Also sorts by recent timestamp.
- Designed to show the top unread notifications first.

### All Notifications
- Shows every fetched notification.
- Displays viewed and new notifications clearly.
- Allows filtering by notification type.
- Supports pagination and client-side page controls.

## API Integration

### Registration and Authentication
- The Test Server uses registration and auth endpoints described in the pre-test setup.
- Registration flow (provided by Test Server):
  - `POST http://20.207.122.201/evaluation-service/register`
  - Body includes `email`, `name`, `mobileNo`, `githubUsername`, `rollNo`, and `accessCode`
- Authentication flow to receive the bearer token:
  - `POST http://20.207.122.201/evaluation-service/auth`
  - Body includes `email`, `name`, `rollNo`, `accessCode`, `clientID`, and `clientSecret`
  - Response includes `token_type: Bearer` and `access_token`

### Notifications endpoint
- `GET http://20.207.122.201/evaluation-service/notifications`
- Query params supported:
  - `limit`
  - `page`
  - `notification_type`

### Log endpoint
- `POST http://20.207.122.201/evaluation-service/logs`
- Body:
  - `stack`
  - `level`
  - `package`
  - `message`

## Notes
- The app is designed to run on `http://localhost:3000`.
- `Material UI` is intentionally not used to keep the implementation lightweight and compliant with the evaluation requirements.
- The app emphasises accessibility, clear UX, and a clean separation between data fetching, logging, and UI state.
