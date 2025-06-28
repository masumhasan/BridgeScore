"use client";

import type { Player } from '@/types/game';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

interface ScoreTableProps {
  players: Player[];
  totalRounds: number;
  currentRound: number;
  dealerIndex: number;
}

export default function ScoreTable({ players, totalRounds, currentRound, dealerIndex }: ScoreTableProps) {
  const roundHeaders = Array.from({ length: totalRounds }, (_, i) => i + 1);

  const winningScore = Math.max(...players.map(p => p.totalScore));

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 min-w-[120px]">Player</TableHead>
                {roundHeaders.map(r => (
                  <TableHead key={r} className={cn("text-center", r === currentRound && "bg-secondary")}>
                    Round {r}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player, playerIndex) => (
                <TableRow key={player.id}>
                  <TableCell className="sticky left-0 bg-card z-10 font-medium">
                    <div className="flex items-center gap-2">
                       {player.name}
                       {playerIndex === dealerIndex && currentRound <= totalRounds && 
                        <span title="Dealer" className="text-xs font-bold text-accent">(D)</span>}
                    </div>
                  </TableCell>
                  {roundHeaders.map(r => (
                    <TableCell key={r} className={cn("text-center", r === currentRound && "bg-secondary")}>
                       {(() => {
                          const roundIndex = r - 1;
                          const call = player.calls[roundIndex];
                          const made = player.made[roundIndex];
                          const score = player.scores[roundIndex];

                          // Handle round 1 display, where score is just tricks made
                          if (r === 1) {
                            return made !== null ? (
                              <div>
                                <span className="font-semibold">{score} pts</span>
                              </div>
                            ) : '-';
                          }

                          // Handle rounds 2+ display
                          if (call !== null) {
                            return (
                              <div>
                                <span className="text-muted-foreground">{call}</span>
                                <span> / </span>
                                <span className={cn(
                                  made === call ? 'text-green-600' : 'text-destructive'
                                )}>
                                  {made !== null ? made : 'Lost'}
                                </span>
                                <div className="text-xs font-semibold">{score} pts</div>
                              </div>
                            )
                          }
                          
                          return '-';
                      })()}
                    </TableCell>
                  ))}
                  <TableCell className={cn("text-center font-bold text-lg", player.totalScore > 0 && player.totalScore === winningScore && "text-accent")}>
                    <div className='flex items-center justify-center gap-1'>
                      {player.totalScore}
                      {player.totalScore > 0 && player.totalScore === winningScore && <Crown className="w-4 h-4" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
