import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Layout } from "@/components/Layout";
import { OverviewPage } from "@/pages/OverviewPage";
import { DetectionsPage } from "@/pages/DetectionsPage";
import { RoadsPage } from "@/pages/RoadsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { UploadPage } from "@/pages/UploadPage";
import { GalleryPage } from "@/pages/GalleryPage";

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
      <Layout>
        <Switch>
          <Route path="/" component={OverviewPage} />
          <Route path="/detections" component={DetectionsPage} />
          <Route path="/roads" component={RoadsPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/gallery" component={GalleryPage} />
          <Route path="/upload" component={UploadPage} />
        </Switch>
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
