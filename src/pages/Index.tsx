import { useMatchStore } from '@/store/matchStore';
import MatchSetup from '@/components/MatchSetup';
import LiveScoring from '@/components/LiveScoring';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { view } = useMatchStore();

  switch (view) {
    case 'live':
      return <LiveScoring />;
    case 'dashboard':
      return <Dashboard />;
    default:
      return <MatchSetup />;
  }
};

export default Index;
