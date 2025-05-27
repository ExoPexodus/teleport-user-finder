
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RoleScheduler from "./pages/RoleScheduler";
import ScheduledJobs from "./pages/ScheduledJobs";
import NotFound from "./pages/NotFound";
import { AIAssistantButton } from "./components/AIAssistant/AIAssistantButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter basename="/teleportui">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/scheduler" element={<RoleScheduler />} />
        <Route path="/scheduled-jobs" element={<ScheduledJobs />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AIAssistantButton />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
