import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Lobby from "@/pages/lobby";
import TownNaming from "@/pages/town-naming";
import TownVoting from "@/pages/town-voting";
import RoleAssignment from "@/pages/role-assignment";
import NightPhase from "@/pages/night-phase";
import DayPhase from "@/pages/day-phase";
import VotingPhase from "@/pages/voting-phase";
import GameEnd from "@/pages/game-end";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lobby/:code" component={Lobby} />
      <Route path="/town-naming/:code" component={TownNaming} />
      <Route path="/town-voting/:code" component={TownVoting} />
      <Route path="/role-assignment/:code" component={RoleAssignment} />
      <Route path="/night/:code" component={NightPhase} />
      <Route path="/day/:code" component={DayPhase} />
      <Route path="/voting/:code" component={VotingPhase} />
      <Route path="/game-end/:code" component={GameEnd} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
