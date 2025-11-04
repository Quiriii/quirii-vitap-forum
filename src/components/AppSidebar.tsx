import { Home, Building2, Users, FileText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LADIES_HOSTELS, MENS_HOSTELS, COMMON_SECTIONS } from '@/lib/hostelMapping';

export function AppSidebar() {
  const { profile } = useAuth();

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
      : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground';

  const canAccessHostel = (hostel: string) => {
    return profile?.hostel === hostel;
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="text-sidebar-foreground">
          <h2 className="text-lg font-bold">Query</h2>
          <p className="text-xs text-sidebar-foreground/70">Your Voice, Our Action</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/" end className={getNavClassName}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">Ladies Hostels</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {LADIES_HOSTELS.map((hostel) => (
                <SidebarMenuItem key={hostel}>
                  <SidebarMenuButton asChild disabled={!canAccessHostel(hostel)}>
                    <NavLink
                      to={`/category/${hostel}`}
                      className={canAccessHostel(hostel) ? getNavClassName : 'opacity-50 cursor-not-allowed'}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>{hostel}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">Men's Hostels</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENS_HOSTELS.map((hostel) => (
                <SidebarMenuItem key={hostel}>
                  <SidebarMenuButton asChild disabled={!canAccessHostel(hostel)}>
                    <NavLink
                      to={`/category/${hostel}`}
                      className={canAccessHostel(hostel) ? getNavClassName : 'opacity-50 cursor-not-allowed'}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>{hostel}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">Common Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {COMMON_SECTIONS.map((section) => (
                <SidebarMenuItem key={section}>
                  <SidebarMenuButton asChild>
                    <NavLink to={`/category/${section}`} className={getNavClassName}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{section}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
