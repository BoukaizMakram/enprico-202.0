import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrafficTracker from '@/components/TrafficTracker';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <TrafficTracker />
      <Header />
      {children}
      <Footer />
    </div>
  );
}
