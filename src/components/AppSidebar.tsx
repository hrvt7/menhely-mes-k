import { LayoutDashboard, PawPrint, Upload, BarChart3, Settings, LogOut } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Áttekintés", url: "/dashboard", icon: LayoutDashboard },
  { title: "Állatok", url: "/animals", icon: PawPrint },
  { title: "Import", url: "/import", icon: Upload },
  { title: "Riportok", url: "/reports", icon: BarChart3 },
  { title: "Beállítások", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { shelterInfo, signOut, user } = useAuth();

  const initials = shelterInfo?.name
    ? shelterInfo.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "SO";

  return (
    <Sidebar className="border-r-0" style={{ background: 'hsl(var(--sidebar-background))' }}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(142,72%,29%)] to-[hsl(160,64%,35%)] text-white shadow-md">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-sidebar-foreground">ShelterOps</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator style={{ background: 'hsl(var(--sidebar-border))' }} />

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <RouterNavLink
                      to={item.url}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 text-[hsl(var(--sidebar-muted))] hover:text-sidebar-foreground",
                        isActive && "text-sidebar-primary font-semibold border-l-2 border-sidebar-primary bg-[hsl(var(--sidebar-active))]"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator style={{ background: 'hsl(var(--sidebar-border))' }} className="mb-3" />
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(142,72%,29%)] to-[hsl(160,64%,35%)] text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{shelterInfo?.name ?? "ShelterOps"}</p>
            <p className="text-xs truncate text-[hsl(var(--sidebar-muted))]">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--sidebar-muted))] hover:text-red-400 transition-colors duration-150"
            title="Kijelentkezés"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
