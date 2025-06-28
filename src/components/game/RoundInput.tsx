"use client";

import { useState, useMemo } from 'react';
import type { Player, GamePhase } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, CheckCircle, XCircle, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RoundInputProps {
  round: number;
  phase: GamePhase;
  players: Player[];
  dealerIndex: number;
  setCalls: (calls: number[]) => void;
  setMade: (made: number[]) => void;
  setOutcomes: (outcomes: ('won' | 'lost')[]) => void;
}

const TRICKS_PER_ROUND = 13;

const NumericStepper = ({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (newValue: string) => void;
  min: number;
  max: number;
}) => {
  const handleValueChange = (newValue: number) => {
    if (newValue >= min && newValue <= max) {
      onChange(newValue.toString());
    } else if (newValue < min) {
      onChange(min.toString());
    } else if (newValue > max) {
      onChange(max.toString());
    }
  };

  const increment = () => {
    const numValue = value === '' ? min - 1 : parseInt(value, 10);
    handleValueChange(numValue + 1);
  };

  const decrement = () => {
    const numValue = value === '' ? min + 1 : parseInt(value, 10);
    handleValueChange(numValue - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      onChange('');
      return;
    }
    const numValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numValue) && numValue >= 0) {
      handleValueChange(numValue);
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value, 10);
    if (e.target.value !== '' && (isNaN(numValue) || numValue < min)) {
      onChange(min.toString());
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full shrink-0"
        onClick={decrement}
        disabled={value !== '' && parseInt(value) <= min}
      >
        <Minus className="h-5 w-5" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="h-12 w-20 text-center text-2xl font-bold bg-transparent border-x-0 border-t-0 border-b-2 border-input rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder="-"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full shrink-0"
        onClick={increment}
        disabled={value !== '' && parseInt(value) >= max}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
};


export default function RoundInput({ round, phase, players, setCalls, setMade, setOutcomes }: RoundInputProps) {
  const { toast } = useToast();
  
  const [inputs, setInputs] = useState<string[]>(Array(players.length).fill(''));
  
  const [outcomes, setOutcomesState] = useState<('won' | 'lost' | null)[]>(Array(players.length).fill(null));

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleOutcomeClick = (index: number, outcome: 'won' | 'lost') => {
    const newOutcomes = [...outcomes];
    newOutcomes[index] = outcome;
    setOutcomesState(newOutcomes);
  };
  
  const allOutcomesSet = useMemo(() => !outcomes.includes(null), [outcomes]);

  const { total, isValid, validationMessage } = useMemo(() => {
    const numericInputs = inputs.map(val => parseInt(val, 10)).filter(num => !isNaN(num));
    const total = numericInputs.reduce((sum, val) => sum + val, 0);
    const allInputsFilled = inputs.every(i => i.trim() !== '');

    if (phase === 'calling') {
      const hasInvalidCall = numericInputs.some(c => c < 2);
      if (hasInvalidCall) {
        return { total, isValid: false, validationMessage: 'Minimum call for any player is 2.' }
      }
      return { total, isValid: allInputsFilled && total >= TRICKS_PER_ROUND, validationMessage: `Total calls must be 13 or more.` };
    }
    
    // 'making' phase (only for round 1)
    return { total, isValid: allInputsFilled && total === TRICKS_PER_ROUND, validationMessage: `Total tricks made must be exactly ${TRICKS_PER_ROUND}.` };
    
  }, [inputs, players.length, phase]);

  const handleNumericSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast({ title: "Invalid Input", description: validationMessage, variant: "destructive" });
      return;
    }
    const numericInputs = inputs.map(val => parseInt(val, 10));
    if (phase === 'calling') {
      setCalls(numericInputs);
    } else { // 'making' phase, must be round 1
      setMade(numericInputs);
    }
  };

  const handleOutcomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allOutcomesSet) {
        toast({ title: "Incomplete", description: "Please select an outcome for every player.", variant: "destructive" });
        return;
    }
    setOutcomes(outcomes as ('won'|'lost')[]);
  };

  if (phase === 'making' && round > 1) {
    return (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Round {round} - Record Outcomes</CardTitle>
            <CardDescription>Select whether each player won (made their call) or lost.</CardDescription>
          </CardHeader>
          <form onSubmit={handleOutcomeSubmit}>
            <CardContent className="space-y-2">
              {players.map((player, index) => (
                <div key={player.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">Called: {player.calls[round-1]}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant={outcomes[index] === 'won' ? 'default' : 'outline'} size="icon" onClick={() => handleOutcomeClick(index, 'won')} className={cn(outcomes[index] === 'won' && "bg-green-600 hover:bg-green-700 text-white")}>
                        <Check className="h-5 w-5" />
                    </Button>
                     <Button type="button" variant={outcomes[index] === 'lost' ? 'destructive' : 'outline'} size="icon" onClick={() => handleOutcomeClick(index, 'lost')}>
                        <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!allOutcomesSet}>
                Finish Round
              </Button>
            </CardFooter>
          </form>
        </Card>
    );
  }

  // Fallback to numeric input for 'calling' phase and round 1 'making' phase
  const isCallingPhase = phase === 'calling';
  const title = isCallingPhase ? 'Make Your Calls' : 'Record Tricks Made (Round 1)';
  const description = isCallingPhase 
    ? `Each player calls how many tricks they will win. Minimum call is 2. The total must be 13 or more.`
    : `Enter how many tricks each player won. The total must be exactly 13.`;
  const buttonText = isCallingPhase ? 'Submit Calls' : 'Finish Round';

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Round {round} - {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleNumericSubmit}>
        <CardContent className="space-y-3">
          {players.map((player, index) => (
            <div key={player.id} className="flex justify-between items-center p-3 rounded-lg bg-card border">
              <Label htmlFor={`input-${player.id}`} className="font-semibold text-base">{player.name}</Label>
              <NumericStepper
                value={inputs[index]}
                onChange={(newValue) => handleInputChange(index, newValue)}
                min={isCallingPhase ? 2 : 0}
                max={TRICKS_PER_ROUND}
              />
            </div>
          ))}
          <div className="pt-4 text-center">
              <p className="font-bold text-lg">Total: {total}</p>
              <div className={cn("flex items-center justify-center gap-2 transition-opacity", inputs.some(i => i !== '') ? 'opacity-100' : 'opacity-0')}>
                {isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Valid!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-destructive font-medium">{validationMessage}</span>
                  </>
                )}
              </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isValid}>
            {buttonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
