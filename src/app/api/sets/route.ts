import { NextResponse } from 'next/server';
import { getScarletVioletSets } from '@/lib/pokemon-tcg';

export async function GET() {
  try {
    const sets = await getScarletVioletSets();
    return NextResponse.json(sets);
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}
