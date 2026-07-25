'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';

export default function CreateSegmentPage() {
    const router = useRouter();

    return (
        <div className="ds-segment-create min-h-screen flex flex-col items-center justify-center p-4">
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
    </div>
    );
}
