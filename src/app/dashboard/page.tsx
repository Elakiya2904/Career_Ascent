'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FileUploader from '@/components/file-uploader';
import { useToast } from '@/hooks/use-toast';
import { analyzeResume, type AnalyzeResumeOutput } from '@/ai/flows/resume-analysis';
import { jobRecommendations, type JobRecommendationsOutput } from '@/ai/flows/job-recommendations';
import { rejectionAnalysis, type RejectionAnalysisOutput } from '@/ai/flows/rejection-analysis';
import { Loader2, Briefcase, Building, Star, ShieldX, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type AnalysisHistoryItem } from '@/app/history/page';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [rejectionJobTitle, setRejectionJobTitle] = useState('');

  const [resumeAnalysisResult, setResumeAnalysisResult] = useState<AnalyzeResumeOutput | null>(null);
  const [jobRecsResult, setJobRecsResult] = useState<JobRecommendationsOutput | null>(null);
  const [rejectionResult, setRejectionResult] = useState<RejectionAnalysisOutput | null>(null);

  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);
  const [isJobRecsLoading, setIsJobRecsLoading] = useState(false);
  const [isRejectionLoading, setIsRejectionLoading] = useState(false);

  const { toast } = useToast();

  const handleFileUpload = (uploadedFile: File, dataUri: string) => {
    setFile(uploadedFile);
    setFileDataUri(dataUri);
    // Reset results when a new file is uploaded
    setResumeAnalysisResult(null);
    setJobRecsResult(null);
    setRejectionResult(null);
  };

  const handleAnalyzeResume = async () => {
    if (!fileDataUri) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload a resume first.' });
      return;
    }
    if (!jobTitle.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a job title.' });
      return;
    }
    setIsResumeAnalyzing(true);
    setResumeAnalysisResult(null);
    try {
      const result = await analyzeResume({ resumeDataUri: fileDataUri, jobTitle });
      setResumeAnalysisResult(result);

      // Save to history
      const historyItem: AnalysisHistoryItem = {
          id: new Date().toISOString(),
          jobTitle: jobTitle,
          score: result.matchScore,
          date: new Date().toISOString(),
      };
      const existingHistory: AnalysisHistoryItem[] = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      localStorage.setItem('analysisHistory', JSON.stringify([historyItem, ...existingHistory]));

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not analyze the resume.' });
    } finally {
      setIsResumeAnalyzing(false);
    }
  };

  const handleJobRecs = async () => {
    if (!fileDataUri) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload a resume first.' });
      return;
    }
    setIsJobRecsLoading(true);
    setJobRecsResult(null);
    try {
      const result = await jobRecommendations({ resumeDataUri: fileDataUri });
      setJobRecsResult(result);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to get recommendations', description: 'Could not fetch job recommendations.' });
    } finally {
      setIsJobRecsLoading(false);
    }
  };

  const handleRejectionAnalysis = async () => {
    if (!fileDataUri) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload a resume first.' });
      return;
    }
    if (!rejectionJobTitle.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a job title.' });
      return;
    }
    setIsRejectionLoading(true);
    setRejectionResult(null);
    try {
      const result = await rejectionAnalysis({ resumeDataUri: fileDataUri, jobTitle: rejectionJobTitle });
      setRejectionResult(result);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not perform rejection analysis.' });
    } finally {
      setIsRejectionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>Upload your resume in PDF or image format to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader onFileUpload={handleFileUpload} file={file} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <Tabs defaultValue="analysis">
            <CardHeader>
              <CardTitle>AI Analysis Tools</CardTitle>
              <CardDescription>Analyze your resume against job descriptions and get recommendations.</CardDescription>
              <TabsList className="grid w-full grid-cols-3 mt-4">
                <TabsTrigger value="analysis"><Star className="w-4 h-4 mr-2"/>Resume Analysis</TabsTrigger>
                <TabsTrigger value="recommendations"><Briefcase className="w-4 h-4 mr-2"/>Job Recommendations</TabsTrigger>
                <TabsTrigger value="rejection"><ShieldX className="w-4 h-4 mr-2"/>Rejection Analysis</TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="analysis" className="p-0">
              <CardContent className="space-y-4">
                 <div>
                  <h3 className="font-semibold mb-2">Job Title</h3>
                   <Input
                    placeholder="e.g. Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-4">
                <Button onClick={handleAnalyzeResume} disabled={isResumeAnalyzing || !fileDataUri}>
                  {isResumeAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                  Analyze Match
                </Button>
                {isResumeAnalyzing && (
                    <div className="w-full text-center p-4 text-muted-foreground">
                        <p>Analyzing... this may take a moment.</p>
                    </div>
                )}
                {resumeAnalysisResult && (
                  <Card className="w-full bg-background">
                    <CardHeader>
                      <CardTitle>Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center gap-4">
                            <div className="relative h-24 w-24">
                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                    <path className="text-muted/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                    <path className="text-primary" strokeDasharray={`${resumeAnalysisResult.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold font-heading">{resumeAnalysisResult.matchScore}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">Match Score</h4>
                                <p className="text-muted-foreground">Your resume's alignment with the job.</p>
                            </div>
                        </div>
                      <div className="prose prose-sm max-w-none text-foreground">{resumeAnalysisResult.analysis}</div>
                      {resumeAnalysisResult.suggestions && resumeAnalysisResult.suggestions.length > 0 && (
                        <div className="pt-4">
                            <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> AI Suggestions for Improvement</h4>
                            <div className="space-y-2">
                            {resumeAnalysisResult.suggestions.map((item, index) => (
                                <Popover key={index}>
                                <PopoverTrigger asChild>
                                    <div className="grid grid-cols-[25px_1fr] items-start gap-4 cursor-pointer p-2 rounded-md hover:bg-muted transition-colors">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 translate-y-0.5" />
                                        <p className="font-semibold text-foreground">
                                        {item.point}
                                        </p>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h3 className="font-medium leading-none flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-amber-500" /> Improvement Point
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                        {item.point}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-medium leading-none flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Suggestion
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                        {item.suggestion}
                                        </p>
                                    </div>
                                    </div>
                                </PopoverContent>
                                </Popover>
                            ))}
                            </div>
                        </div>
                        )}
                    </CardContent>
                  </Card>
                )}
              </CardFooter>
            </TabsContent>
            <TabsContent value="recommendations" className="p-0">
               <CardContent>
                 <p className="text-sm text-muted-foreground">Get AI-powered job recommendations based on your uploaded resume.</p>
               </CardContent>
               <CardFooter className="flex-col items-start gap-4">
                <Button onClick={handleJobRecs} disabled={isJobRecsLoading || !fileDataUri}>
                    {isJobRecsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />}
                    Get Job Recommendations
                </Button>
                 {isJobRecsLoading && (
                    <div className="w-full text-center p-4 text-muted-foreground">
                        <p>Searching for opportunities...</p>
                    </div>
                )}
                {jobRecsResult && (
                    <div className="w-full space-y-4">
                        <h3 className="font-semibold text-lg">Recommended For You</h3>
                        {jobRecsResult.recommendations.map((rec, index) => (
                        <Card key={index} className="bg-background">
                            <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/>{rec.jobTitle}</CardTitle>
                            <CardDescription className="flex items-center gap-2"><Building className="w-4 h-4"/>{rec.company}</CardDescription>
                            </CardHeader>
                            <CardContent>
                            <p className="text-sm prose prose-sm max-w-none">{rec.reasoning}</p>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                )}
               </CardFooter>
            </TabsContent>
            <TabsContent value="rejection" className="p-0">
                 <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Job Title</h3>
                         <Input
                          placeholder="e.g. Product Manager"
                          value={rejectionJobTitle}
                          onChange={(e) => setRejectionJobTitle(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                    <Button onClick={handleRejectionAnalysis} disabled={isRejectionLoading || !fileDataUri}>
                        {isRejectionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldX className="mr-2 h-4 w-4" />}
                        Analyze Rejection Reasons
                    </Button>
                    {isRejectionLoading && (
                        <div className="w-full text-center p-4 text-muted-foreground">
                            <p>Thinking about potential issues...</p>
                        </div>
                    )}
                    {rejectionResult && (
                         <Card className="w-full bg-background">
                            <CardHeader>
                              <CardTitle>Rejection Analysis & Feedback</CardTitle>
                              <CardDescription>AI-powered insights into why you might have been rejected and how to improve. Hover over an item for details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {rejectionResult.reasons.map((item, index) => (
                                  <Popover key={index}>
                                    <PopoverTrigger asChild>
                                      <div className="grid grid-cols-[25px_1fr] items-start gap-4 cursor-pointer p-2 rounded-md hover:bg-muted transition-colors">
                                          <AlertTriangle className="w-5 h-5 text-amber-500 translate-y-0.5" />
                                          <p className="font-semibold text-foreground">
                                            {item.reason}
                                          </p>
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                      <div className="grid gap-4">
                                        <div className="space-y-2">
                                          <h3 className="font-medium leading-none flex items-center gap-2">
                                              <AlertTriangle className="w-5 h-5 text-amber-500" /> Potential Issue
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {item.reason}
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <h3 className="font-medium leading-none flex items-center gap-2">
                                              <CheckCircle2 className="w-5 h-5 text-green-500" /> Suggestion
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {item.suggestion}
                                          </p>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

    