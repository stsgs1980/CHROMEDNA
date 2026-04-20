import { NextRequest, NextResponse } from 'next/server';
import { generateEnergyData } from '@/lib/energyGenerators';
import { calculateCompositeScore } from '@/lib/aiScoring';
import { EnergySymbol } from '@/types/energy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = (searchParams.get('symbol') || 'CL') as EnergySymbol;
  
  const validSymbols: EnergySymbol[] = ['CL', 'NG', 'RB', 'HO'];
  if (!validSymbols.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }

  const candles = generateEnergyData(symbol, 200);
  const aiScore = calculateCompositeScore(candles);

  return NextResponse.json(aiScore);
}
