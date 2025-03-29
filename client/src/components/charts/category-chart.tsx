import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type CategoryChartProps = {
  data: Array<{
    name: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  isLoading: boolean;
};

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

export function CategoryChart({ data, isLoading }: CategoryChartProps) {
  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="space-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="h-3 w-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-700">{entry.value}</span>
            </div>
            <span className="font-medium">{data.find(item => item.name === entry.value)?.percentage}%</span>
          </div>
        ))}
      </div>
    );
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-sm">
          <p className="font-medium">{item.name}</p>
          <p className="text-gray-500">{formatCurrency(item.value)}</p>
          <p className="text-primary">{item.payload.percentage}%</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
          </div>
        ) : data.length > 0 ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {renderLegend({ payload: data.map(item => ({ color: item.color, value: item.name })) })}
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center flex-col">
            <div className="text-center p-4">
              <p className="text-gray-400">No category data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
