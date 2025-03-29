import { useMemo } from "react";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

export function SpendingChart() {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
  });
  
  const chartData = useMemo(() => {
    if (!transactions) return [];
    
    const today = new Date();
    const startDate = subDays(today, parseInt(timeRange));
    
    // Create a map with dates as keys and amounts as values
    const dateMap = new Map();
    
    // Initialize all dates in the range with 0
    for (let i = 0; i <= parseInt(timeRange); i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dateMap.set(dateStr, { income: 0, expense: 0 });
    }
    
    // Fill in the actual transaction data
    transactions.forEach((transaction: any) => {
      const date = parseISO(transaction.date);
      if (date >= startDate && date <= today) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const existing = dateMap.get(dateStr) || { income: 0, expense: 0 };
        
        if (transaction.isIncome) {
          existing.income += Number(transaction.amount);
        } else {
          existing.expense += Number(transaction.amount);
        }
        
        dateMap.set(dateStr, existing);
      }
    });
    
    // Convert map to array sorted by date
    return Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        income: values.income,
        expense: values.expense,
        displayDate: format(parseISO(date), 'MMM d')
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, timeRange]);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Spending Overview</CardTitle>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F44336" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis 
                dataKey="displayDate" 
                stroke="#9e9e9e" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9e9e9e' }}
                tickMargin={10}
              />
              <YAxis 
                stroke="#9e9e9e" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9e9e9e' }}
                tickFormatter={(value) => value === 0 ? '0' : `$${value}`}
                tickMargin={10}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ borderRadius: '4px', fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="#4CAF50" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#income-gradient)" 
                name="Income"
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="#F44336" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#expense-gradient)"
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center flex-col">
            <div className="text-center p-4">
              <p className="text-gray-400">No transaction data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
