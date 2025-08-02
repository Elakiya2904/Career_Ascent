'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload: (file: File, dataUri: string) => void;
  file: File | null;
}

export default function FileUploader({ onFileUpload, file }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploadedFile = acceptedFiles[0];
      if (uploadedFile) {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = () => {
          const dataUri = reader.result as string;
          onFileUpload(uploadedFile, dataUri);
          setIsProcessing(false);
        };
        reader.onerror = () => {
          console.error('Error reading file');
          setIsProcessing(false);
        };
        reader.readAsDataURL(uploadedFile);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-primary" />;
    if (fileType === 'application/pdf') return <FileText className="h-8 w-8 text-primary" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer transition-colors duration-200',
        isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50 hover:bg-primary/5'
      )}
    >
      <input {...getInputProps()} />
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Processing...</p>
        </div>
      ) : file ? (
        <div className="flex flex-col items-center justify-center gap-2">
          {getFileIcon(file.type)}
          <p className="font-semibold">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            ({(file.size / 1024).toFixed(2)} KB)
          </p>
          <p className="text-sm text-accent mt-2">File ready! Drag or click to replace.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="h-10 w-10 text-primary" />
          <p className="font-semibold">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop your resume here, or click to select'}
          </p>
          <p className="text-sm text-muted-foreground">Supports PDF, PNG, JPG</p>
        </div>
      )}
    </div>
  );
}
