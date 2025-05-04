import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Assign from "@/pages/assign";
import Reassign from "@/pages/reassign";
import { AssignmentProvider } from "@/context/assignment-context";
import { setupGlobalErrorHandler } from "@/components/shared/toast-service";
import { AuthGuard, isAuthenticated } from "@/lib/auth";
import { useEffect } from "react";

// Setup global error handling for fetch
setupGlobalErrorHandler();

function Router() {
  const [location, navigate] = useLocation();

  // Handle protected routes
  useEffect(() => {
    if (
      (location === "/assign" || location === "/reassign") &&
      !isAuthenticated()
    ) {
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/assign" component={Assign} />
      <Route path="/reassign" component={Reassign} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AssignmentProvider>
        <Router />
        <Toaster />
      </AssignmentProvider>
    </QueryClientProvider>
  );
}

export default App;
