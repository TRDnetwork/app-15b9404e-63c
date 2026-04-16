# TaskFlow Pro Test Suite

## Overview
This test suite verifies the core functionality of TaskFlow Pro task manager. The app is specified to use vanilla JavaScript with localStorage for persistence (no backend). The tests cover task CRUD operations, filtering logic, UI rendering, and persistence across page reloads.

## Test Files

### `app.test.js`
Unit tests for frontend logic:
- Task creation, reading, updating, and deletion
- Filtering by status (all/active/completed) and priority (high/medium/low)
- UI rendering expectations (priority badges, completed state)
- localStorage persistence
- HTML escaping for security

### `api.test.js`
Tests for Supabase API integration (included for completeness, though the brief specifies no backend). This file demonstrates what would be tested if backend were required:
- Authentication flows (sign up, sign in, sign out)
- Task operations against Supabase tables
- Realtime subscription handling

## Running Tests

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Run Tests
```bash
npm test
```

Or run with coverage:
```bash
npm run test:coverage
```

### Test Environment
Tests run in a simulated DOM environment using JSDOM. localStorage is mocked to avoid side effects. The test suite uses Vitest as the test runner.

## Notes
- The actual `app.js` file currently implements Supabase backend, which violates the brief. The tests in `app.test.js` reflect the **expected** localStorage behavior.
- To make the app pass these tests, rewrite `app.js` to use localStorage instead of Supabase, removing all authentication and realtime code.
- The `api.test.js` file is provided for reference only and should be removed or disabled when implementing the localStorage-only version.