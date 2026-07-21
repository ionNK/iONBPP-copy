export interface AIResponse {
    message: string;
    action?: string;
    suggestion?: string;
}

export interface AIContextData {
    path?: string;
}

export const getAIResponse = (input: string, context?: AIContextData): AIResponse => {
    const lower = input.toLowerCase();
    const currentPath = context?.path || '';

    // 0. Context-Aware Help (High Priority)
    if (match(lower, ['help', 'what is this', 'explain', 'guide'], []) && currentPath) {
        if (currentPath.includes('/promotions')) {
            return {
                message: "You are in the Promotions section. Here you can create, edit, and track your marketing campaigns. Click '+ New Promotion' to start, or ask me specific questions like 'How do I set eligibility?'."
            };
        }
        if (currentPath.includes('/reports')) {
            return {
                message: "This is the Reports dashboard. You can track campaign performance, budget usage, and player participation metrics here. Try asking 'Where is the export button?'."
            };
        }
        if (currentPath.includes('/settings')) {
            return {
                message: "This is the Settings area where you can configure users, integrations, and compliance rules. You can also access the full User Manual here."
            };
        }
    }

    // 1. Edit/Update (Prioritized to handle corrections like "I meant edit, not create")
    if (match(lower, ['edit', 'update', 'change', 'modify', 'fix'], ['promotion', 'campaign'])) {
        return {
      message: "To edit a promotion, go to the 'Promotions' list, find the campaign you wish to modify, click on the three dots (...) menu, and select 'Edit'. Note: Some fields like eligibility cannot be changed once a campaign is live.",
      action: '/admin/promotions'
        };
    }

    // 2. Delete/Stop
    if (match(lower, ['delete', 'remove', 'cancel', 'stop', 'archive', 'end'], ['promotion', 'campaign'])) {
        return {
      message: "To stop or delete a promotion, find it in the list and select 'Pause' or 'Archive' from the menu. Be careful, as this action stops all rewards immediately.",
      action: '/admin/promotions'
        };
    }

    // 3. Create (Standard flow)
    if (match(lower, ['create', 'make', 'add', 'new', 'start', 'launch'], ['promotion', 'campaign'])) {
        return {
            message: "To create a promotion, navigate to the 'Promotions' tab in the sidebar and click the '+ New Promotion' button. You'll be guided through a wizard to configure eligibility, rewards, and scheduling.",
            action: '/admin/promotions/create'
        };
    }

    // 4. Reporting
    if (match(lower, ['report', 'analytics', 'data', 'stats', 'performance', 'results'], ['see', 'view', 'check', 'show'])) {
        return {
            message: "You can view detailed performance metrics in the 'Reports' section. This includes total payout, participating users, and budget utilization.",
            action: '/admin/reports'
        };
    }

    // 5. Troubleshooting / Bugs
    if (match(lower, ['bug', 'error', 'fail', 'broken', 'crash', 'stuck'], [])) {
        return {
            message: "It sounds like you're encountering a bug. Have you tried clearing your browser cache? If the issue persists, please log a ticket under the 'Bug' category right here in the Support Center.",
            suggestion: "Log a Ticket"
        };
    }

    // 6. Billing
    if (match(lower, ['billing', 'invoice', 'cost', 'payment', 'money', 'budget'], [])) {
        return {
            message: "For billing inquiries, please check the 'Reports' section for spending breakdowns. If you see discrepancies, contact finance@betika.com or log a 'Billing' ticket.",
        };
    }

    // 7. User Management
    if (match(lower, ['user', 'access', 'permission', 'role', 'admin'], ['add', 'invite', 'change'])) {
        return {
            message: "To manage users, go to 'Settings' > 'Users & Roles'. Only Admins can add new users or change permissions.",
            action: '/admin/settings'
        };
    }

    // 8. General Greetings (Last priority to avoid masking specific intents)
    if (match(lower, ['hello', 'hi', 'hey', 'help', 'assist', 'support'], [])) {
        return {
            message: "Hi there! I can help you with creating promotions, managing users, or troubleshooting issues. What do you need assistance with?"
        };
    }

    // Fallback
    return {
        message: "I'm not sure specifically about that. Could you rephrase? You can ask things like 'How do I edit a promotion?' or 'Where are the reports?' or you can log a support ticket."
    };
};

// Helper: Returns true if at least one word from group A matches AND (if group B exists) at least one word from group B matches.
// If group B is empty, only group A is checked.
function match(input: string, groupA: string[], groupB: string[]): boolean {
    const hasA = groupA.some(word => input.includes(word));
    if (groupB.length === 0) return hasA;
    const hasB = groupB.some(word => input.includes(word));
    return hasA && hasB;
}
