import { BetSlipProvider } from '@/context/BetSlipContext';
import BetSlipWidget from '@/components/sports/BetSlipWidget';
import './sports-styles.css';

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BetSlipProvider>
      <div className="sports-layout">
        <div className="sports-main">
          {children}
        </div>
        <BetSlipWidget />
      </div>
    </BetSlipProvider>
  );
}
