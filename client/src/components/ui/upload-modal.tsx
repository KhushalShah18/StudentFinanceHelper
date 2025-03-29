import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface UploadModalProps {
  children: React.ReactNode;
}

export function UploadModal({ children }: UploadModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/transactions/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      setFile(null);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Expense Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your expense data to import multiple expenses at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
            <div className="flex flex-col items-center justify-center py-3">
              <Upload className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-500 mb-2">Drag and drop your CSV file here or</p>
              <label className="bg-primary hover:bg-primary/90 text-white text-sm font-medium py-2 px-4 rounded-md cursor-pointer focus:outline-none transition-all">
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-gray-500 text-xs space-y-1">
            <p>Supported format: CSV</p>
            <p>Maximum file size: 5MB</p>
            <p>
              <a href="#" className="text-primary hover:underline">
                Download sample template
              </a>
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || !file}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
