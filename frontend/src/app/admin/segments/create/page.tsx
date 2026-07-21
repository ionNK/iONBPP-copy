'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';

export default function CreateSegmentPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
            <div className="glass-panel p-12 text-center max-w-lg w-full flex flex-col items-center">
                <div className="w-20 h-20 bg-yellow-soft rounded-full flex items-center justify-center mb-6">
                    <Construction size={40} className="text-betika-yellow" />
                </div>

                <h1 className="text-2xl font-bold text-primary mb-2">Under Construction</h1>
                <p className="text-secondary mb-8">
                    We are redesigning the Segment Creation experience to be more intuitive and powerful. Check back soon.
                </p>

                <button
                    onClick={() => router.back()}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    Go Back
                </button>
            </div>

            <style jsx>{`
                :root {
                    --color-betika-yellow: #F2D641;
                }
                .bg-app { background-color: var(--color-bg-app); }
                .text-primary { color: var(--color-text-primary); }
                .text-secondary { color: var(--color-text-secondary); }
                .text-betika-yellow { color: var(--color-betika-yellow); }
                .bg-yellow-soft { background-color: rgba(242, 214, 65, 0.1); }
                
                .glass-panel { 
                    background: var(--color-bg-panel); 
                    border: 1px solid var(--color-border); 
                    border-radius: 16px; 
                    box-shadow: var(--shadow-lg); 
                }

                .btn { 
                    display: inline-flex; 
                    align-items: center; 
                    padding: 10px 24px; 
                    border-radius: 8px; 
                    font-weight: 600; 
                    font-size: 14px; 
                    transition: all 0.2s; 
                    cursor: pointer;
                    border: 1px solid transparent;
                }
                .btn-secondary { 
                    background: var(--color-bg-panel); 
                    border: 1px solid var(--color-border); 
                    color: var(--color-text-secondary); 
                }
                .btn-secondary:hover { 
                    border-color: var(--color-text-muted); 
                    color: var(--color-text-primary); 
                    background: var(--color-bg-input);
                }
            `}</style>
        </div>
    );
}
