import { NextResponse } from "next/server"

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://leadgen-os.vercel.app"))
  response.cookies.set("leadgen_session", "", { maxAge: 0, path: "/" })
  return response
}
