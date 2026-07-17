import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
export function unauthorized(message = "Missing or unknown user context.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
export function forbidden(message = "Not permitted for your role.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}
