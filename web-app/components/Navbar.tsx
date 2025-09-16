// components/Sidebar.tsx
interface SidebarProps{
  isOwner: boolean;
}

export default function Sidebar({ isOwner }: SidebarProps) {
  return (
    <div className="h-screen w-68 bg-gray-900 text-white flex flex-col justify-between">

      <div className="flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <span className="text-xl font-bold">DePIN App</span>
        </div>

        <nav className="flex flex-col mt-4 space-y-2">
          {isOwner ? (
            <>
              <SidebarItem label="Home" href="/owner/dashboard" />
              <SidebarItem label="Contract Owner Settings" href="#" />
            </>
          ) : (
            <>
              <SidebarItem label="Home" href="/dashboard" />
              <SidebarItem label="My Devices" href="#" />
            </>
          )}
        </nav>
      </div>

      <div className="flex justify-center mb-7">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarItem({ label, href }: { label: string; href?: string }) {
  if (href) {
    return (
      <a href={href} className="flex items-center px-4 py-2 hover:bg-gray-800 cursor-pointer">
        <span>{label}</span>
      </a>
    );
  }
  return (
    <div className="flex items-center px-4 py-2 hover:bg-gray-800 cursor-pointer">
      <span>{label}</span>
    </div>
  );
}
