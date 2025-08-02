import AppSidebar from '@/components/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 bg-background p-4 sm:p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
