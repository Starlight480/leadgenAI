import { NextResponse } from "next/server"
import { getLogoutCookie } from "@/lib/auth-server"

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://leadgen-os.vercel.app")
  )
  response.headers.set("Set-Cookie", getLogoutCookie())
  return response
}
