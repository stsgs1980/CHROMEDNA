import { NextRequest, NextResponse } from 'next/server';
import { generateEnergyData, generateVolumeProfile, generateOrderFlow } from '@/lib/energyGenerators';
import { EnergySymbol } from '@/types/energy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = (searchParams.get('symbol') || 'CL') as EnergySymbol;
  const days = parseInt(searchParams.get('days') || '200');
  
  const validSymbols: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];
  if (!validSymbols.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }

  const candles = generateEnergyData(symbol, Math.min(days, 500));
  const volumeProfile = generateVolumeProfile(candles);
  const orderFlow = generateOrderFlow(candles);

  return NextResponse.json({
    symbol,
    candles,
    volumeProfile,
    orderFlow,
  });
}
