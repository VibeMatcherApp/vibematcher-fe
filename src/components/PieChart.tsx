import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const COLORS = [
  '#679186', // greenish
  '#C492B1', // rose
  '#A8C686', // olive
  '#F7B05B', // warm orange
  '#8AAAE5', // soft blue
  '#D6A2AD', // muted pink
  '#C1DADB', // cool light blue
]

interface PieChartProps {
  data: { name: string; value: number }[]
}

export function PieChart({ data }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full h-full flex items-center justify-center">
      <RechartsPieChart width={300} height={300} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
          label={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${((value as number / total) * 100).toFixed(1)}%`, name]}
          contentStyle={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '8px 12px',
          }}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          formatter={(value, entry, index) => {
            const percentage = ((data[index].value / total) * 100).toFixed(1)
            return `${value} (${percentage}%)`
          }}
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '12px',
          }}
        />
      </RechartsPieChart>
    </div>
  )
} 