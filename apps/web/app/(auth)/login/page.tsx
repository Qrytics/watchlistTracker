/**
 * app/(auth)/login/page.tsx
 *
 * Login page — renders the LoginForm feature component.
 */

import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <LoginForm />;
}
