"use client";

import { useState, useMemo } from 'react';
import type { Player, GamePhase } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RoundInputProps {
  round: number;
  phase: GamePhase;
  players: Player[];
  dealerIndex: number;
  setCalls: (calls: number[]) => void;
  setMade: (made: number[]) => void;
}

const TRICKS_PER_ROUND = 13;

export default function RoundInput({ round, phase, players, setCalls, setMade }: RoundInputProps) {
  const [inputs, setInputs] = useState<string[]>(Array(players.length).fill(''));
  const { toast } = useToast();

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const { total, isValid, validationMessage } = useMemo(() => {
    const numericInputs = inputs.map(val => parseInt(val, 10)).filter(num => !isNaN(num));
    const total = numericInputs.reduce((sum, val) => sum + val, 0);
    const allInputsFilled = numericInputs.length === players.length;

    if (phase === 'calling') {
      const hasInvalidCall = numericInputs.some(c => c < 2);
      if (hasInvalidCall) {
        return {
          total,
          isValid: false,
          validationMessage: 'Minimum call for any player is 2.',
        }
      }
      return {
        total,
        isValid: allInputsFilled && total >= TRICKS_PER_ROUND,
        validationMessage: `Total calls must be 13 or more.`,
      };
    } else { // 'making' phase
      return {
        total,
        isValid: allInputsFilled && total === TRICKS_PER_ROUND,
        validationMessage: `Total tricks made must be exactly ${TRICKS_PER_ROUND}.`,
      };
    }
  }, [inputs, players.length, phase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast({
        title: "Invalid Input",
        description: validationMessage,
        variant: "destructive",
      });
      return;
    }
    const numericInputs = inputs.map(val => parseInt(val, 10));
    if (phase === 'calling') {
      setCalls(numericInputs);
    } else {
      setMade(numericInputs);
    }
  };

  const title = phase === 'calling' ? 'Make Your Calls' : 'Record Tricks Made';
  const description = phase === 'calling' 
    ? `Each player calls how many tricks they will win. Minimum call is 2. The total must be 13 or more.`
    : `Enter how many tricks each player actually won. The total must be exactly 13.`;
  const buttonText = phase === 'calling' ? 'Submit Calls' : 'Finish Round';

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Round {round} - {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {players.map((player, index) => (
            <div key={player.id} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`input-${player.id}`} className="col-span-2 truncate">{player.name}</Label>
              <Input
                id={`input-${player.id}`}
                type="number"
                min={phase === 'calling' ? "2" : "0"}
                max={TRICKS_PER_ROUND}
                value={inputs[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                required
                className="text-center"
              />
            </div>
          ))}
          <div className="pt-4 text-center">
              <p className="font-bold text-lg">Total: {total}</p>
              <div className={cn("flex items-center justify-center gap-2 transition-opacity", inputs.some(i => i !== '') ? 'opacity-100' : 'opacity-0')}>
                {isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Deal is valid!</span>
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
