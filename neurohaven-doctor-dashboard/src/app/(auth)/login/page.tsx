import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Clinical Sign In — NeuroHaven",
  description: "Sign in to the clinical care workstation dashboard of NeuroHaven.",
};

export default function LoginPage() {
  return <LoginForm />;
}
