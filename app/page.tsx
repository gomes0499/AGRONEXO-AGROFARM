import { redirect } from "next/navigation";

export default function Home() {
  redirect("https://agronexo-agrofarm.vercel.app/auth/login");
}