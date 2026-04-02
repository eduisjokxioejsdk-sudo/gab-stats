import { useMatchStore } from '@/store/matchStore';
import MatchSetup from '@/components/MatchSetup';
import LiveScoring from '@/components/LiveScoring';
import Dashboard from '@/components/Dashboard';
import Settings from '@/components/Settings';

const Index = () => {
  const { view } = useMatchStore();

  switch (view) {
    case 'live':
      return <LiveScoring />;
    case 'dashboard':
      return <Dashboard />;
    case 'settings':
      return <Settings />;
    default:
      return <MatchSetup />;
  }
};

export default Index;
