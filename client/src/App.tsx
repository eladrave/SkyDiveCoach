import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import SessionManagement from "@/pages/session-management";
import MenteeSessions from "@/pages/mentee-sessions";
import Progression from "@/pages/progression";
import UserManagement from "@/pages/users";
import Calendar from "@/pages/calendar";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/sessions" component={SessionManagement} />
      <Route path="/mentee-sessions" component={MenteeSessions} />
      <Route path="/progression" component={Progression} />
      <Route path="/users" component={UserManagement} />
      <Route path="/calendar" component={Calendar} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
