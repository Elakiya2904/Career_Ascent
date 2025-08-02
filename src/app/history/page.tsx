'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface AnalysisHistoryItem {
  id: string;
  jobTitle: string;
  score: number;
  date: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedHistory = localStorage.getItem('analysisHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('analysisHistory');
    setHistory([]);
  };

  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading">Analysis History</h1>
        {history.length > 0 && (
          <Button variant="destructive" onClick={clearHistory}>
            Clear History
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Past Analyses</CardTitle>
          <CardDescription>A log of all your previously run resume analyses.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Job Title</TableHead>
                  <TableHead className="text-center">Match Score</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium truncate max-w-sm">
                      <p className="truncate">
                        {item.jobTitle}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.score > 80 ? 'default' : item.score > 70 ? 'secondary' : 'destructive'} className="text-white" style={item.score > 80 ? {backgroundColor: 'hsl(var(--primary))'} : {}} >
                        {item.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{new Date(item.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
                <p className="text-muted-foreground">You haven't analyzed any resumes yet.</p>
                <p className="text-sm text-muted-foreground">Your analysis history will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    