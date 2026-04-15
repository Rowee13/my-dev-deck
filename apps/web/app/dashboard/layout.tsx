import { Sidebar } from '../../components/layout/Sidebar';
import { DemoBanner } from '../../components/demo-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <DemoBanner />
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
