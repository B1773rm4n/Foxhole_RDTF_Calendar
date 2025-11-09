# Test Suite

This directory contains comprehensive tests for the Foxhole RotDust Calendar application.

## Running Tests

Run all tests:
```bash
deno task test
```

Run tests in watch mode (auto-rerun on changes):
```bash
deno task test:watch
```

Run a specific test file:
```bash
deno test --allow-net --allow-read --allow-write --allow-env tests/database.test.ts
```

## Test Files

- **database.test.ts** - Tests for database operations (users, shifts, CRUD)
- **validation.test.ts** - Tests for input validation functions
- **timezone.test.ts** - Tests for timezone conversion utilities
- **errors.test.ts** - Tests for error handling and custom error classes
- **security.test.ts** - Tests for security utilities (rate limiting, headers)

## Notes

- Tests use a separate test database to avoid affecting production data
- Some tests may require cleanup between runs
- Rate limiting tests may need time-based assertions in a real scenario

