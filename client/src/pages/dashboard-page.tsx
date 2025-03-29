import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { SpendingChart } from "@/components/charts/spending-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { Card, CardContent } from "@/components/ui/card";
import { UploadModal } from "@/components/ui/upload-modal";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, TrendingUp, LightbulbIcon, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
  });
  
  // Get the appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Category chart data transformation
  const categoryChartData = dashboardData?.categoryBreakdown?.map((category: any) => ({
    name: category.name,
    value: category.amount,
    color: category.color,
    percentage: category.percentage
  })) || [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar title="Dashboard" />

        <div className="p-4 lg:p-6 bg-gray-50 flex-grow">
          {/* Welcome Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">
                    {isLoading ? (
                      <Skeleton className="h-7 w-48" />
                    ) : (
                      `${getGreeting()}, ${user?.fullName || user?.username}!`
                    )}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {isLoading ? (
                      <Skeleton className="h-5 w-64" />
                    ) : (
                      `Here's your financial overview for ${format(new Date(), 'MMMM yyyy')}.`
                    )}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <UploadModal>
                    <Button className="flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Add Expense</span>
                    </Button>
                  </UploadModal>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Balance */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Total Balance</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <h4 className="text-xl font-medium mt-1 text-gray-700">
                        {formatCurrency(dashboardData?.balance)}
                      </h4>
                    )}
                    <div className="mt-2">
                      {isLoading ? (
                        <Skeleton className="h-4 w-28" />
                      ) : (
                        <p className="text-green-500 text-xs font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +2.5% this month
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                    <span className="material-icons">account_balance</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Income */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Monthly Income</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <h4 className="text-xl font-medium mt-1 text-gray-700">
                        {formatCurrency(dashboardData?.monthlyIncome)}
                      </h4>
                    )}
                    <div className="mt-2">
                      {isLoading ? (
                        <Skeleton className="h-4 w-28" />
                      ) : (
                        <p className="text-green-500 text-xs font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +1.8% this month
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-500 bg-opacity-10 flex items-center justify-center text-green-500">
                    <span className="material-icons">payments</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expenses */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Monthly Expenses</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <h4 className="text-xl font-medium mt-1 text-gray-700">
                        {formatCurrency(dashboardData?.monthlyExpenses)}
                      </h4>
                    )}
                    <div className="mt-2">
                      {isLoading ? (
                        <Skeleton className="h-4 w-28" />
                      ) : (
                        <p className="text-red-500 text-xs font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +4.2% this month
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center text-red-500">
                    <span className="material-icons">shopping_cart</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Left */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm">Budget Left</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-24 mt-1" />
                    ) : (
                      <h4 className="text-xl font-medium mt-1 text-gray-700">
                        {formatCurrency(dashboardData?.budgetRemaining)}
                      </h4>
                    )}
                    <div className="mt-2">
                      {isLoading ? (
                        <Skeleton className="h-4 w-28" />
                      ) : (
                        <p className="text-gray-500 text-xs">
                          48% of monthly budget
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-500 bg-opacity-10 flex items-center justify-center text-amber-500">
                    <span className="material-icons">savings</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Spending Chart */}
            <div className="lg:col-span-2">
              <SpendingChart />
            </div>

            {/* Category Chart */}
            <div>
              <CategoryChart data={categoryChartData} isLoading={isLoading} />
            </div>
          </div>

          {/* Recent Transactions & Budget Alerts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <Card className="lg:col-span-2">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-700">Recent Transactions</h3>
                  <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                    View All
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-3">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24 mt-1" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                ) : dashboardData?.recentTransactions?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.recentTransactions.map((transaction: any) => (
                          <tr key={transaction.id}>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3 text-primary">
                                  <span className="material-icons text-sm">description</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">{transaction.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <Badge variant="outline" className="bg-primary bg-opacity-10 text-primary border-0">
                                {transaction.categoryId ? "Category" : "Uncategorized"}
                              </Badge>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(transaction.date), 'MMM d, yyyy')}
                            </td>
                            <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium text-right ${transaction.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent transactions found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Alerts & Tips */}
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-700">Alerts & Tips</h3>
                </div>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="text-red-500 h-5 w-5 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Food Budget Alert</h4>
                          <p className="text-xs text-gray-500 mt-1">You've spent 85% of your monthly food budget. Consider adjusting your spending habits.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-start">
                        <LightbulbIcon className="text-green-500 h-5 w-5 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Student Discount Available</h4>
                          <p className="text-xs text-gray-500 mt-1">Local grocery store offers 10% off for students on Tuesdays. Show your student ID.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-start">
                        <Calendar className="text-amber-500 h-5 w-5 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Upcoming Bill Payment</h4>
                          <p className="text-xs text-gray-500 mt-1">Your utility bill of $75 is due in 3 days. Make sure you have enough funds.</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-2 text-primary border-primary hover:bg-primary/5">
                      View Community Tips
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
