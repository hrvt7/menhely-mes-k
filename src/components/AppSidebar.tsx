import { BarChart3, PawPrint, FolderOpen, Settings, LogOut, PieChart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
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
  { title: "Áttekintés", url: "/dashboard", icon: BarChart3 },
  { title: "Állatok", url: "/animals", icon: PawPrint },
  { title: "Import", url: "/import", icon: FolderOpen },
  { title: "Riportok", url: "/reports", icon: PieChart },
  { title: "Beállítások", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { shelterInfo, signOut, user } = useAuth();

  const initials = shelterInfo?.name
    ? shelterInfo.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "SO";

  return (
    <Sidebar className="bg-sidebar border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(143,47%,45%)] to-[hsl(170,50%,40%)] text-white text-sm font-bold shadow-md">
            🐾
          </div>
          <span className="font-bold text-base tracking-tight text-sidebar-foreground">ShelterOps</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-sidebar-border" />

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-[hsl(var(--sidebar-muted))] hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold border-l-[3px] border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator className="bg-sidebar-border mb-3" />
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{shelterInfo?.name ?? "ShelterOps"}</p>
            <p className="text-xs truncate text-[hsl(var(--sidebar-muted))]">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--sidebar-muted))] hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Kijelentkezés"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
