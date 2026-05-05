import React, { useState, useRef } from 'react';
import { Upload, Film, Play, AlertCircle, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { generateVeoVideo, getVideoDownloadUrl, checkApiKeySelection, promptApiKeySelection } from '../services/geminiService';
import { LoadingState } from '../types';

export const VeoStudio: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for API
        const base64Data = base64String.split(',')[1];
        setImage(base64Data);
        // Keep the preview with prefix
        const preview = document.getElementById('image-preview') as HTMLImageElement;
        if (preview) preview.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;

    // Billing check
    const hasKey = await checkApiKeySelection();
    if (!hasKey) {
      try {
        await promptApiKeySelection();
        // Assume success after dialog interaction or prompt again if failed next time
      } catch (e) {
        console.error("Key selection failed", e);
        return;
      }
    }

    setStatus('generating');
    setError(null);
    setVideoUrl(null);

    try {
      const uri = await generateVeoVideo(image, prompt);
      setVideoUrl(getVideoDownloadUrl(uri));
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video");
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Film className="h-8 w-8" />
          Veo Video Studio
        </h2>
        <p className="text-zinc-500">
          Turn your static images into dynamic videos using Google's Veo model.
          <span className="block text-xs mt-1 text-amber-600 flex items-center gap-1">
             <Info className="h-3 w-3"/> Requires a paid Google Cloud Project API key.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Upload Source Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border-2 border-dashed border-zinc-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors cursor-pointer min-h-[200px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                {image ? (
                  <img 
                    id="image-preview" 
                    src={`data:image/png;base64,${image}`} 
                    alt="Preview" 
                    className="max-h-64 rounded shadow-sm object-contain" 
                  />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-zinc-400 mb-4" />
                    <p className="text-sm font-medium text-zinc-900">Click to upload an image</p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG supported</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Configure & Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">
                  Motion Prompt (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the motion, e.g., 'Pan right revealing more of the landscape', 'The water flows naturally'"
                  className="w-full rounded-md border border-zinc-300 p-3 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 min-h-[100px]"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={!image || status === 'generating'}
                isLoading={status === 'generating'}
              >
                {status === 'generating' ? 'Generating Video (may take 1-2 mins)...' : 'Generate Video'}
              </Button>
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>3. Result</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[300px] bg-zinc-900/5 rounded-b-lg">
              {status === 'generating' ? (
                <div className="text-center space-y-4">
                  <div className="animate-pulse flex space-x-4">
                    <div className="h-12 w-12 bg-zinc-300 rounded-full mx-auto"></div>
                  </div>
                  <p className="text-sm text-zinc-500">Processing with Veo...</p>
                </div>
              ) : videoUrl ? (
                <div className="w-full h-full flex flex-col items-center">
                   <video 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full rounded-lg shadow-lg border border-zinc-200"
                    src={videoUrl}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <a 
                    href={videoUrl} 
                    download="veo-generation.mp4"
                    className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Upload className="h-3 w-3 rotate-180" /> Download Video
                  </a>
                </div>
              ) : (
                <div className="text-center text-zinc-400">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Video preview will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};