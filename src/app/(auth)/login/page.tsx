import LoginForm from "./login-form";

export const metadata = { title: "Daxil ol — SkyServices ERP" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-brand-navy">SkyServices ERP</h1>
          <p className="text-sm text-slate-500">Daxil ol</p>
        </div>
        <LoginForm next={searchParams.next ?? "/dashboard"} />
      </div>
    </main>
  );
}
