import { AppNav } from '@/components/layout/AppNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2EDDF]">
      <AppNav />
      <div className="md:ms-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </div>
    </div>
  )
}
