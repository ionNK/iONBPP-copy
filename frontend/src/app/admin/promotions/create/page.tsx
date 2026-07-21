'use client';
import { WizardProvider } from '@/context/WizardContext';
import CreatePromotionWizard from '@/components/wizard/CreatePromotionWizard';

export default function CreatePromotionPage() {
return (
<WizardProvider>
<CreatePromotionWizard />
</WizardProvider>
);
}
