import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, errors?: unknown) {
  const body: { success: false; message: string; errors?: unknown } = {
    success: false,
    message,
  };
  if (errors !== undefined) {
    body.errors = errors;
  }
  return NextResponse.json(body, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed", 400, error.flatten());
  }

  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return fail("Unauthorized", 401);
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return fail("Forbidden", 403);
  }

  console.error(error);
  return fail("Internal server error", 500);
}
