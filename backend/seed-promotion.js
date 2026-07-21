
async function seed() {
    const promo = {
        name: 'High Roller Bonus',
        description: 'Bet more than $50 and get a reward',
        type: 'cashback',
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        config: {
            criteria: {
                minStake: 50
            },
            reward: {
                amount: 10
            }
        }
    };

    try {
        const response = await fetch('http://localhost:4000/promotions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promo)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Promotion created:', data.id);
        } else {
            console.error('❌ Failed to create promotion:', await response.text());
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

seed();
