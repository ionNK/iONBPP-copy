import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Mock backend processing delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Validation (Mock)
        if (!body.name || !body.type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('--- PROMOTION CREATED ---');
        console.log('ID:', body.id);
        console.log('Name:', body.name);
        console.log('Type:', body.type);
        console.log('Schedule:', body.period);
        console.log('Banner:', body.bannerImage ? 'Yes (Base64)' : 'No');
        console.log('T&Cs Length:', body.termsAndConditions?.length || 0);
        console.log('-------------------------');

        // Allow successful creation regardless of DB connection for this prototype
        return NextResponse.json({
            success: true,
            id: body.id,
            message: 'Promotion successfully created via API'
        });

    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
