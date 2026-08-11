'use client';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Player, getPlayer } from '@/data/players';
import Player360 from '@/components/crm/Player360';
import { features } from '@/config/features';

export default function CustomerDetail() {
if (!features.play360) notFound();
  const params = useParams();
  const id = params?.id as string;
  const [customer, setCustomer] = useState<Player | null | undefined>(undefined);

  useEffect(() => {
    setCustomer(getPlayer(id) ?? null);
  }, [id]);

  return (
    <div className="ds-crm-detail">
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
    </div>
  );
}
