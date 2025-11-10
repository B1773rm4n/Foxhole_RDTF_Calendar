import { assertEquals } from "@std/assert";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  handleError
} from "../backend/utils/errors.ts";

Deno.test("ValidationError", () => {
  const error = new ValidationError("Invalid input");
  assertEquals(error.name, "ValidationError");
  assertEquals(error.message, "Invalid input");
  
  const response = handleError(error);
  assertEquals(response.status, 400);
});

Deno.test("AuthenticationError", () => {
  const error = new AuthenticationError();
  assertEquals(error.name, "AuthenticationError");
  
  const response = handleError(error);
  assertEquals(response.status, 401);
});

Deno.test("AuthorizationError", () => {
  const error = new AuthorizationError("Not allowed");
  assertEquals(error.name, "AuthorizationError");
  assertEquals(error.message, "Not allowed");
  
  const response = handleError(error);
  assertEquals(response.status, 403);
});

Deno.test("NotFoundError", () => {
  const error = new NotFoundError("Resource");
  assertEquals(error.name, "NotFoundError");
  assertEquals(error.message, "Resource not found");
  
  const response = handleError(error);
  assertEquals(response.status, 404);
});

Deno.test("DatabaseError", () => {
  const error = new DatabaseError("DB connection failed");
  assertEquals(error.name, "DatabaseError");
  assertEquals(error.message, "DB connection failed");
  
  const response = handleError(error);
  assertEquals(response.status, 500);
});

Deno.test("Generic error handling", () => {
  const error = new Error("Something went wrong");
  const response = handleError(error);
  assertEquals(response.status, 500);
  
  const unknownError = "String error";
  const response2 = handleError(unknownError);
  assertEquals(response2.status, 500);
});

