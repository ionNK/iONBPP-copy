'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerPreview from '@/components/preview/CustomerPreview';

export default function PromotionPreviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // You can pass promotion data via URL params or localStorage
    // For now, using sample data
    const samplePromotion = {
        title: 'VFL 100% Win Bonus Boost',
        subtitle: '100% Win Bonus Boost on Virtual Football League',
        howItWorks: [
            'Place a cash multi-bet with a minimum of 2 selections on Virtual Football League (VFL) events.',
            'If your bet wins, you will receive a bonus boost based on the number of selections in your bet slip.',
            'The bonus percentage increases with more selections:',
            '2 selections = 5% boost',
            '5 selections = 10% boost',
            '10 selections = 30% boost',
            '21+ selections = 100% boost',
            'For a cash multi-bet to be eligible for the Win Bonus Boost, at least any five (5) selections must each have minimum odds of 1.30 and only one of your selections must lose.',
            'For example, if your bet slip has the following selections 1.50; 1.02; 3.90; 1.42; 1.20;1.35; 1.38; 1.19; 1.85; 1.73; 1.22; 1.19 and one selection lose (irrespective of the odds), you will be entitled to 100% of your stake back.',
            'Only sports book cash bets placed on Betika channels are eligible for this Promotion. The Win Bonus Boost shall be deposited into the winning customer(s) Betika Wallet and may be withdrawn at the customer\'s discretion.'
        ],
        terms: [
            'This Promotion is only available to Betika customers who have registered and verified their accounts.',
            'Cancelled bets and cashed-out bets will not be eligible for this Promotion.',
            'Where there is a dispute regarding the award of the Win Bonus Boost, the adjudication and decision of Gaming Commission of Ghana shall be final.',
            'Where the system erroneously generates bonuses or winnings more than the allowed maximum limit, any amount above this limit will be regarded as void and not validly due and payable.',
            'Betika reserves the right to void any winnings, at its sole discretion, and taking all remedial action in instances including: System or software malfunction or error; or Suspicion that there are Prohibited Activities being undertaken.',
            'In case of the occurrence of any Prohibited Acts, Betika may take such action as it deems necessary in the circumstances, including but not limited to voiding any winnings or transactions, suspending an account, limiting withdrawals, and/or blocking an IP address(es).',
            'Betika reserves the right to request from the customers and verify, with the relevant authorities, any required documentation for purposes of identification or due diligence.'
        ]
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {/* Admin Controls Bar */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: '#18181b',
                borderBottom: '2px solid #F2D641',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2000,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            background: '#3f3f46',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back to Admin
                    </button>
                    <div style={{
                        background: '#F2D641',
                        color: '#000000',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Preview Mode
                    </div>
                </div>
                <div style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>
                    This is what customers will see
                </div>
            </div>

            {/* Customer Preview */}
            <div style={{ paddingTop: '50px' }}>
                <CustomerPreview promotion={samplePromotion} />
            </div>
        </div>
    );
}
