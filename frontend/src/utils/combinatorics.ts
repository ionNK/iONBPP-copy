export type CombinationType = 'single' | 'double' | 'treble' | 'acca' | 'trixie' | 'patent' | 'lucky15' | 'lucky31' | 'lucky63';

export interface CombInfo {
  type: CombinationType;
  label: string;
  lines: number;
}

export function getAvailableCombinations(numSelections: number): CombInfo[] {
  const combs: CombInfo[] = [];
  if (numSelections === 0) return combs;

  if (numSelections >= 1) {
    combs.push({ type: 'single', label: `Singles`, lines: numSelections });
  }
  if (numSelections >= 2) {
    combs.push({ type: 'double', label: `Doubles`, lines: combinations(numSelections, 2) });
  }
  if (numSelections >= 3) {
    combs.push({ type: 'treble', label: `Trebles`, lines: combinations(numSelections, 3) });
  }
  if (numSelections > 3) {
    combs.push({ type: 'acca', label: `Accumulator (${numSelections} folds)`, lines: 1 });
  }

  // System bets
  if (numSelections === 3) {
    combs.push({ type: 'trixie', label: 'Trixie', lines: 4 });
  }
  if (numSelections === 3) {
    combs.push({ type: 'patent', label: 'Patent', lines: 7 });
  }
  if (numSelections === 4) {
    combs.push({ type: 'lucky15', label: 'Lucky 15', lines: 15 });
  }
  if (numSelections === 5) {
    combs.push({ type: 'lucky31', label: 'Lucky 31', lines: 31 });
  }
  if (numSelections === 6) {
    combs.push({ type: 'lucky63', label: 'Lucky 63', lines: 63 });
  }
  
  return combs;
}

// Math helpers
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

export function combinations(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

export function getCombinationIterator(oddsArray: number[], k: number): number[][] {
  const result: number[][] = [];
  function combine(start: number, combo: number[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < oddsArray.length; i++) {
        combo.push(oddsArray[i]);
        combine(i + 1, combo);
        combo.pop();
    }
  }
  combine(0, []);
  return result;
}

export function calculateCombinatoricsReturn(oddsArray: number[], type: CombinationType, baseStake: number): number {
    let totalReturn = 0;
    
    // Core multipliers
    const calc = (k: number) => {
        const permutations = getCombinationIterator(oddsArray, k);
        let ret = 0;
        for (const p of permutations) {
           ret += baseStake * p.reduce((acc, curr) => acc * curr, 1);
        }
        return ret;
    }

    if (type === 'single') totalReturn += calc(1);
    else if (type === 'double') totalReturn += calc(2);
    else if (type === 'treble') totalReturn += calc(3);
    else if (type === 'acca') totalReturn += calc(oddsArray.length);
    else if (type === 'trixie') {
        // 3 doubles + 1 treble
        totalReturn += calc(2) + calc(3);
    } else if (type === 'patent') {
        // 3 singles + 3 doubles + 1 treble
        totalReturn += calc(1) + calc(2) + calc(3);
    } else if (type === 'lucky15') {
        // 4 singles + 6 doubles + 4 trebles + 1 fourfold
        totalReturn += calc(1) + calc(2) + calc(3) + calc(4);
    } else if (type === 'lucky31') {
        // 5 singles + 10 doubles + 10 trebles + 5 fourfolds + 1 fivefold
        totalReturn += calc(1) + calc(2) + calc(3) + calc(4) + calc(5);
    } else if (type === 'lucky63') {
        // 6 singles + 15 doubles + 20 trebles + 15 fourfolds + 6 fivefolds + 1 sixfold
        totalReturn += calc(1) + calc(2) + calc(3) + calc(4) + calc(5) + calc(6);
    }
    
    return totalReturn;
}
