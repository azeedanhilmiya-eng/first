import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WorkspaceLayout from "./pages/workspace/WorkspaceLayout";
import TopicPage from "./pages/workspace/TopicPage";
import BPPage from "./pages/workspace/BPPage";
import PrototypePage from "./pages/workspace/PrototypePage";
import ReviewPage from "./pages/workspace/ReviewPage";
import PPTPage from "./pages/workspace/PPTPage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  { path: "/dashboard", Component: DashboardPage },
  {
    path: "/workspace",
    Component: WorkspaceLayout,
    children: [
      { index: true, Component: TopicPage },
      { path: "topic", Component: TopicPage },
      { path: "bp", Component: BPPage },
      { path: "prototype", Component: PrototypePage },
      { path: "review", Component: ReviewPage },
      { path: "ppt", Component: PPTPage },
    ],
  },
  { path: "/settings", Component: SettingsPage },
]);
