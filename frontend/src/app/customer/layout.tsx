import CustomerHeader from '@/components/customer/CustomerHeader';
import { RewardsProvider } from '@/context/RewardsContext';
import './customer.css';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RewardsProvider>
      <div className="customer-shell">
        <CustomerHeader />
        <main className="customer-main">
          {children}
        </main>

        <style>{`
          .customer-shell {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background: var(--color-bg-app);
            background-image: 
               radial-gradient(circle at 15% 50%, rgba(168, 85, 247, 0.05), transparent 40%),
               radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.05), transparent 40%);
          }
          .customer-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            width: 100%;
          }
        `}</style>
      </div>
    </RewardsProvider>
  );
}
