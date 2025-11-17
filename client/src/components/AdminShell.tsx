import { Switch, Route } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Appointments from "@/pages/appointments";
import Offices from "@/pages/offices";
import { LogOut, UserCircle, Settings } from "lucide-react";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { useState } from "react";

export function AdminShell() {
  const { logout, user } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/admin/dashboard" component={Home} />
                <Route path="/admin/citas" component={Appointments} />
                <Route path="/admin/consultorios" component={Offices} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
}
