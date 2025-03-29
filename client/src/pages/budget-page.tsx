import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, addMonths } from "date-fns";
import { AlertCircle, Calendar as CalendarIcon, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function BudgetPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addMonths(new Date(), 1));
  const { toast } = useToast();

  // Budget form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState<string>("monthly");

  // Fetching budgets
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['/api/budgets'],
  });

  // Fetching categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Add budget mutation
  const addBudgetMutation = useMutation({
    mutationFn: async (budget: any) => {
      const res = await apiRequest("POST", "/api/budgets", budget);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget added",
        description: "Your budget has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Budget deleted",
        description: "Your budget has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setAmount("");
    setCategory(undefined);
    setPeriod("monthly");
    setStartDate(new Date());
    setEndDate(addMonths(new Date(), 1));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category || !startDate) {
      toast({
        title: "Invalid form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const budget = {
      amount: parseFloat(amount),
      categoryId: parseInt(category),
      period: period,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
    };

    addBudgetMutation.mutate(budget);
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar title="Budget" />

        <div className="p-4 lg:p-6 bg-gray-50 flex-grow">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Budget Planning</h1>
              <p className="text-gray-500">Set up and manage your spending budgets</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    <span>Create Budget</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Budget</DialogTitle>
                    <DialogDescription>
                      Set a budget for a specific category and time period.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriesLoading ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Budget Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="period">Budget Period</Label>
                        <Select value={period} onValueChange={setPeriod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PP") : <span>Start date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>End Date (Optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PP") : <span>End date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addBudgetMutation.isPending}>
                        {addBudgetMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Budget"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Budget Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>Your current month budget progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Budget</span>
                    <span className="font-medium">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : (
                        formatCurrency(
                          budgets?.reduce((sum: number, budget: any) => sum + parseFloat(budget.amount), 0)
                        )
                      )}
                    </span>
                  </div>
                  <Progress value={52} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Spent</span>
                    <span className="font-medium">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin inline" />
                      ) : (
                        "52%"
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 flex-grow bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "48%" }}></div>
                    </div>
                    <div className="h-2 flex-grow bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300" style={{ width: "52%" }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-500">Remaining: 48%</span>
                    <span className="text-gray-500">Spent: 52%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="relative">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-2 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : budgets?.length > 0 ? (
              budgets.map((budget: any) => {
                const category = categories?.find((cat: any) => cat.id === budget.categoryId);
                const spentPercentage = Math.min(Math.round(((budget?.spent || 0) / parseFloat(budget.amount)) * 100), 100);
                const isOverBudget = spentPercentage >= 100;
                const isWarning = spentPercentage >= 80 && spentPercentage < 100;
                
                return (
                  <Card key={budget.id} className="relative">
                    <CardContent className="p-6">
                      <div className="absolute top-4 right-4 flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-400 hover:text-red-600"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this budget?")) {
                              deleteBudgetMutation.mutate(budget.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <h3 className="text-md font-medium text-gray-500">{category?.name || "Uncategorized"}</h3>
                      <div className="flex items-baseline mt-1">
                        <span className="text-2xl font-bold text-gray-800">
                          {formatCurrency(parseFloat(budget.amount))}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">per {budget.period}</span>
                      </div>
                      
                      <div className="mt-4 mb-1 flex justify-between text-sm">
                        <span>Progress</span>
                        <span className={cn(
                          isOverBudget ? "text-red-500" : isWarning ? "text-amber-500" : "text-gray-500"
                        )}>
                          {spentPercentage}%
                        </span>
                      </div>
                      
                      <Progress 
                        value={spentPercentage} 
                        className={cn(
                          "h-2",
                          isOverBudget ? "bg-red-100" : isWarning ? "bg-amber-100" : ""
                        )}
                        indicatorClassName={cn(
                          isOverBudget ? "bg-red-500" : isWarning ? "bg-amber-500" : ""
                        )}
                      />
                      
                      <div className="mt-4 flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Spent: </span>
                          <span className="font-medium">{formatCurrency(budget?.spent || 0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Left: </span>
                          <span className={cn(
                            "font-medium",
                            isOverBudget ? "text-red-500" : ""
                          )}>
                            {formatCurrency(budget?.remaining || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {(isOverBudget || isWarning) && (
                        <div className={cn(
                          "mt-3 p-2 rounded-md flex items-start",
                          isOverBudget ? "bg-red-50" : "bg-amber-50"
                        )}>
                          <AlertCircle className={cn(
                            "h-4 w-4 mr-2 mt-0.5",
                            isOverBudget ? "text-red-500" : "text-amber-500"
                          )} />
                          <p className="text-xs">
                            {isOverBudget
                              ? "You've exceeded this budget. Consider adjusting your spending."
                              : "You're close to exceeding this budget. Be careful with further spending."}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-500">
                        {`${format(parseISO(budget.startDate), 'MMM d, yyyy')} - ${
                          budget.endDate ? format(parseISO(budget.endDate), 'MMM d, yyyy') : 'Ongoing'
                        }`}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12">
                <span className="material-icons text-4xl text-gray-300">account_balance_wallet</span>
                <h3 className="mt-2 text-gray-700 font-medium">No budgets found</h3>
                <p className="text-gray-500 mt-1">Create your first budget to start tracking your spending</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Budget
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
