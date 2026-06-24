import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Layout } from "@/components/Layout";
import { OverviewPage } from "@/pages/OverviewPage";
import { DetectionsPage } from "@/pages/DetectionsPage";
import { RoadsPage } from "@/pages/RoadsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Switch>
            <Route path="/" component={OverviewPage} />
            <Route path="/detections" component={DetectionsPage} />
            <Route path="/roads" component={RoadsPage} />
            <Route path="/analytics" component={AnalyticsPage} />
          </Switch>
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
