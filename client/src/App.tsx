import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Reception from "@/pages/Reception";
import Triage from "@/pages/Triage";
import Doctor from "@/pages/Doctor";
import Display from "@/pages/Display";
import Analytics from "@/pages/Analytics";
import Layout from "@/components/layout/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Reception} />
        <Route path="/triage" component={Triage} />
        <Route path="/doctor" component={Doctor} />
        <Route path="/display" component={Display} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
