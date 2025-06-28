"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spade, Users, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewGameFormProps {
  startGame: (players: string[], winningScore: number, tag?: string) => void;
}

export default function NewGameForm({ startGame }: NewGameFormProps) {
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [tag, setTag] = useState('');
  const [winningScore, setWinningScore] = useState('50');
  const { toast } = useToast();

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerNames.some(name => name.trim() === '')) {
      toast({
        title: "Validation Error",
        description: "All four player names are required.",
        variant: "destructive",
      });
      return;
    }
    if (new Set(playerNames.map(n => n.trim())).size !== 4) {
      toast({
        title: "Validation Error",
        description: "Player names must be unique.",
        variant: "destructive",
      });
      return;
    }

    const parsedWinningScore = parseInt(winningScore, 10);
    if (isNaN(parsedWinningScore) || parsedWinningScore <= 0) {
      toast({
        title: "Validation Error",
        description: "Winning score must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    startGame(playerNames.map(name => name.trim()), parsedWinningScore, tag.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2">
            <Spade className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl font-bold">BridgeScore</CardTitle>
          </div>
          <CardDescription>Set up a new game for four players.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="font-semibold flex items-center gap-2"><Users className="w-4 h-4"/>Player Names</Label>
              {playerNames.map((name, index) => (
                <Input
                  key={index}
                  type="text"
                  placeholder={`Player ${index + 1}`}
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  required
                  className="bg-white"
                />
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag" className="font-semibold">Game Tag (Optional)</Label>
              <Input
                id="tag"
                type="text"
                placeholder="e.g. Friday Night Bridge"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="winningScore" className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4" />Winning Score</Label>
              <Input
                id="winningScore"
                type="number"
                placeholder="e.g. 50"
                value={winningScore}
                onChange={(e) => setWinningScore(e.target.value)}
                className="bg-white"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Start Game
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
