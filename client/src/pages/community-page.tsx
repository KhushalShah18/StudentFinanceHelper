import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { 
  Calendar, 
  ExternalLink, 
  Heart, 
  Lightbulb, 
  Link2, 
  Loader2, 
  MapPin, 
  MessageSquare, 
  Plus, 
  Tag 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export default function CommunityPage() {
  const [isAddTipDialogOpen, setIsAddTipDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Tip form state
  const [tipTitle, setTipTitle] = useState("");
  const [tipContent, setTipContent] = useState("");

  // Fetching tips and deals
  const { data: tips, isLoading: tipsLoading } = useQuery({
    queryKey: ['/api/community-tips'],
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['/api/deals'],
  });

  // Add tip mutation
  const addTipMutation = useMutation({
    mutationFn: async (tipData: any) => {
      const res = await apiRequest("POST", "/api/community-tips", tipData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Tip submitted",
        description: "Your financial tip has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/community-tips'] });
      resetTipForm();
      setIsAddTipDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit tip",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset tip form
  const resetTipForm = () => {
    setTipTitle("");
    setTipContent("");
  };

  // Handle tip form submission
  const handleTipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipTitle || !tipContent) {
      toast({
        title: "Invalid form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const tipData = {
      userId: user?.id,
      title: tipTitle,
      content: tipContent,
      isApproved: false,
    };

    addTipMutation.mutate(tipData);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar title="Community" />

        <div className="p-4 lg:p-6 bg-gray-50 flex-grow">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Community</h1>
              <p className="text-gray-500">Discover financial tips and local deals from other students</p>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="tips" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="tips">Financial Tips</TabsTrigger>
              <TabsTrigger value="deals">Local Deals</TabsTrigger>
            </TabsList>
            
            {/* Financial Tips Tab */}
            <TabsContent value="tips">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Community Financial Tips</h2>
                <Dialog open={isAddTipDialogOpen} onOpenChange={setIsAddTipDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Share Tip</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share a Financial Tip</DialogTitle>
                      <DialogDescription>
                        Share your financial knowledge and experience with other international students.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleTipSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={tipTitle}
                            onChange={(e) => setTipTitle(e.target.value)}
                            placeholder="E.g., How to save money on textbooks"
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="content">Tip Content</Label>
                          <Textarea
                            id="content"
                            value={tipContent}
                            onChange={(e) => setTipContent(e.target.value)}
                            placeholder="Share your advice in detail..."
                            rows={6}
                            required
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsAddTipDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addTipMutation.isPending}>
                          {addTipMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Tip"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {tipsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : tips?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tips.map((tip: any) => (
                    <Card key={tip.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Tip</Badge>
                            </div>
                            <CardTitle className="text-lg">{tip.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-gray-600 text-sm">{tip.content}</p>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(tip.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button className="flex items-center hover:text-primary transition-colors">
                            <Heart className="h-3 w-3 mr-1" />
                            <span>{tip.likes}</span>
                          </button>
                          <button className="flex items-center hover:text-primary transition-colors">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span>Comment</span>
                          </button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="mt-2 text-gray-700 font-medium">No tips yet</h3>
                  <p className="text-gray-500 mt-1">Be the first to share a financial tip with the community</p>
                  <Button onClick={() => setIsAddTipDialogOpen(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Share a Tip
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Local Deals Tab */}
            <TabsContent value="deals">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Local Student Deals</h2>
              </div>
              
              {dealsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : deals?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deals.map((deal: any) => (
                    <Card key={deal.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Tag className="h-4 w-4 text-green-500" />
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Deal</Badge>
                            </div>
                            <CardTitle className="text-lg">{deal.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-gray-600 text-sm mb-4">{deal.description}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            <span>{deal.location}</span>
                          </div>
                          {deal.validUntil && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              <span>Valid until {formatDate(deal.validUntil)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {deal.link && (
                        <CardFooter className="pt-0">
                          <a 
                            href={deal.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs flex items-center text-primary hover:underline"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Visit website
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="mt-2 text-gray-700 font-medium">No deals available</h3>
                  <p className="text-gray-500 mt-1">Check back later for student discounts and deals</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
