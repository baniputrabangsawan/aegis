import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoginForm } from "@/components/login-form";
import { getAuth } from "@/server/auth/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  return <LoginForm />;
}
