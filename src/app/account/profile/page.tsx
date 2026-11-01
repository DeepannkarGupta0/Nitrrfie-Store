import { UserProfile } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Profile & Security | NITRRFIE Store",
  description: "Manage your NITRRFIE Store account details, authentication, and security preferences.",
};

export default function ProfilePage() {
  return (
    <div className="px-4 py-10 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#ff782e]">NIT Raipur Student Account</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Profile & Security</h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage your account credentials, verified college email, and security settings.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
