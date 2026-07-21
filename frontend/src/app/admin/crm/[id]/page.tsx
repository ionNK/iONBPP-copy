'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Player, getPlayer } from '@/data/players';
import Player360 from '@/components/crm/Player360';

export default function CustomerDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [customer, setCustomer] = useState<Player | null | undefined>(undefined);

  useEffect(() => {
    setCustomer(getPlayer(id) ?? null);
  }, [id]);

  return (
    <div className="page-container">
      <Link href="/admin/crm" className="back-link">
        <ArrowLeft size={16} /> Back to CRM
      </Link>

      {customer === undefined ? (
        <div className="glass-panel empty">Loading player…</div>
      ) : customer === null ? (
        <div className="glass-panel empty">Customer not found.</div>
      ) : (
        <Player360 player={customer} />
      )}

      <style jsx>{`
        .page-container { max-width: 1200px; margin: 0 auto; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-text-secondary); text-decoration: none; font-size: 14px; margin-bottom: 20px; }
        .back-link:hover { color: var(--color-text-primary); }
        .empty { padding: 40px; text-align: center; color: var(--color-text-muted); }
      `}</style>
    </div>
  );
}
