
const { Kafka } = require('kafkajs');

async function run() {
    const kafka = new Kafka({
        clientId: 'simulator',
        brokers: ['localhost:9092'],
    });

    const producer = kafka.producer();

    await producer.connect();

    // This event matches the 'High Roller Bonus' (amount > 50)
    const event = {
        eventType: 'bet_placed',
        playerId: 'user-777', // Lucky user
        amount: 150, // Matches > 50 condition
        currency: 'USD',
        timestamp: new Date().toISOString()
    };

    console.log('Sending event:', event);

    await producer.send({
        topic: 'player-events',
        messages: [
            { value: JSON.stringify(event) },
        ],
    });

    console.log('Event sent successfully');
    await producer.disconnect();
}

run().catch(console.error);
