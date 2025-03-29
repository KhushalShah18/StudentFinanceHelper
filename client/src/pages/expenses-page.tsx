import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { DataTable } from "@/components/ui/data-table";
import { UploadModal } from "@/components/ui/upload-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Plus, Loader2, Filter } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { ColumnDef } from "@tanstack/react-table";

type Transaction = {
  id: number;
  description: string;
  amount: number;
  date: string;
  isIncome: boolean;
  categoryId: number | null;
};

export default function ExpensesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [expenseType, setExpenseType] = useState("expense");
  const { toast } = useToast();

  // Transaction form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);

  // Fetching transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
  });

  // Fetching categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const res = await apiRequest("POST", "/api/transactions", transaction);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction added",
        description: "Your transaction has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Transaction deleted",
        description: "Your transaction has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory(undefined);
    setDate(new Date());
    setExpenseType("expense");
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !date) {
      toast({
        title: "Invalid form",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const transaction = {
      description,
      amount: parseFloat(amount),
      date: date.toISOString(),
      isIncome: expenseType === "income",
      categoryId: category ? parseInt(category) : null,
    };

    addTransactionMutation.mutate(transaction);
  };

  // Define table columns
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
            <span className="material-icons text-primary text-sm">description</span>
          </div>
          <div className="font-medium">{row.getValue("description")}</div>
        </div>
      ),
    },
    {
      accessorKey: "categoryId",
      header: "Category",
      cell: ({ row }) => {
        const categoryId = row.getValue("categoryId") as number | null;
        const category = categories?.find((cat: any) => cat.id === categoryId);
        
        return (
          <div className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-primary bg-opacity-10 text-primary">
            {category?.name || "Uncategorized"}
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(parseISO(row.getValue("date")), "MMM d, yyyy"),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const isIncome = row.original.isIncome;
        
        return (
          <div className={`text-right font-medium ${isIncome ? "text-green-500" : "text-red-500"}`}>
            {isIncome ? "+" : "-"}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this transaction?")) {
                deleteTransactionMutation.mutate(row.original.id);
              }
            }}
            className="text-red-500 hover:text-red-700"
          >
            <span className="material-icons text-sm">delete</span>
          </Button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar title="Expenses" />

        <div className="p-4 lg:p-6 bg-gray-50 flex-grow">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
              <p className="text-gray-500">Manage your income and expenses</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <UploadModal>
                <Button variant="outline" className="flex items-center">
                  <span className="material-icons text-sm mr-1">upload</span>
                  <span>Import CSV</span>
                </Button>
              </UploadModal>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    <span>Add Transaction</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>
                      Add a new income or expense to your financial records.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Transaction Type</Label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="transaction-type"
                              checked={expenseType === "income"}
                              onCheckedChange={(checked) => setExpenseType(checked ? "income" : "expense")}
                            />
                            <Label htmlFor="transaction-type">
                              {expenseType === "income" ? "Income" : "Expense"}
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="What was this transaction for?"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount ($)</Label>
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
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
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
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addTransactionMutation.isPending}>
                        {addTransactionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Transaction"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions?.length > 0 ? (
                <DataTable 
                  columns={columns} 
                  data={transactions} 
                  searchKey="description"
                  searchPlaceholder="Search transactions..." 
                />
              ) : (
                <div className="text-center py-10">
                  <span className="material-icons text-4xl text-gray-300">receipt_long</span>
                  <h3 className="mt-2 text-gray-700 font-medium">No transactions yet</h3>
                  <p className="text-gray-500 mt-1">Add your first transaction to get started</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Transaction
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
