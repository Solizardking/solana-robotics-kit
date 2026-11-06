import ClawdBrain from "./pages/ClawdBrain";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PhantomProvider } from "./contexts/PhantomContext";
import Home from "./pages/Home";
import RobotRegistry from "./pages/RobotRegistry";
import AvatarGenerator from "./pages/AvatarGenerator";
import AgentArena from "./pages/AgentArena";
import HedgeFund from "./pages/HedgeFund";
import PredictionMarket from "./pages/PredictionMarket";
import SOLtronProfile from "./pages/SOLtronProfile";
import TradeFeed from "./pages/TradeFeed";
import Dashboard from "./pages/Dashboard";
import TradingTerminal from "./pages/TradingTerminal";
import Documentation from "./pages/Documentation";
import AuthCallback from "./pages/AuthCallback";
import TokenGate from "./pages/TokenGate";
import Portfolio from "./pages/Portfolio";
import RobotPassport from "./pages/RobotPassport";
import ModelGallery from "./pages/ModelGallery";
import VoiceAgent from "./pages/VoiceAgent";
import ConversationalAI from "./pages/ConversationalAI";
import SOLbot from "./pages/SOLbot";
import TokenLaunch from "./pages/TokenLaunch";
import FeeClaiming from "./pages/FeeClaiming";
import TradeHistory from "./pages/TradeHistory";
import PriceAlerts from "./pages/PriceAlerts";
import VibeStudio from "./pages/VibeStudio";
import NFTForge from "./pages/NFTForge";
import Burn from "./pages/Burn";
import Asimov from "./pages/Asimov";
import MainLayout from "./components/MainLayout";
import GrokAgent from "./components/GrokAgent";
import ElevenLabsWidget from "./components/ElevenLabsWidget";

function Router() {
  return (
    <Switch>
      <Route path="/clawd-brain" component={ClawdBrain} />
      <Route path="/soltron-companion" component={ClawdBrain} />
      <Route path="/" component={Home} />
      <Route path="/robots" component={RobotRegistry} />
      <Route path="/avatar" component={AvatarGenerator} />
      <Route path="/arena" component={AgentArena} />
      <Route path="/hedge-fund" component={HedgeFund} />
      <Route path="/prediction-market" component={PredictionMarket} />
      <Route path="/soltron" component={SOLtronProfile} />
      <Route path="/trade-feed" component={TradeFeed} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/terminal" component={TradingTerminal} />
      <Route path="/docs" component={Documentation} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/gate" component={TokenGate} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/passport" component={RobotPassport} />
      <Route path="/models" component={ModelGallery} />
      <Route path="/voice" component={VoiceAgent} />
      <Route path="/ai" component={ConversationalAI} />
      <Route path="/solbot" component={SOLbot} />
      <Route path="/launch" component={TokenLaunch} />
      <Route path="/fees" component={FeeClaiming} />
      <Route path="/history" component={TradeHistory} />
      <Route path="/alerts" component={PriceAlerts} />
      <Route path="/vibe-studio" component={VibeStudio} />
      <Route path="/nft-forge" component={NFTForge} />
      <Route path="/burn" component={Burn} />
      <Route path="/asimov" component={Asimov} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <PhantomProvider>
          <TooltipProvider>
            <Toaster />
            <MainLayout>
              <Router />
              <GrokAgent />
              <ElevenLabsWidget />
            </MainLayout>
          </TooltipProvider>
        </PhantomProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
