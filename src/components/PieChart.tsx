import { PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts'

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
  matchPercentage?: number
}

export function PieChart({ data, matchPercentage }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative w-full h-[240px] max-w-[300px]">
        <RechartsPieChart width={300} height={240}>
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
            formatter={(value: number, name: string) => [
              `${name}: ${((value / total) * 100).toFixed(1)}%`
            ]}
            labelFormatter={() => ''}
            separator=""
            contentStyle={{
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '8px 12px',
            }}
          />
        </RechartsPieChart>
        {matchPercentage !== undefined && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-500">Match</span>
            <span className="text-3xl font-bold text-primary">{matchPercentage}%</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center items-center text-xs text-center w-full text-gray-700" style={{ paddingTop: '20px' }}>
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center" style={{ marginRight: '10px', marginBottom: '4px' }}>
            <span
              className="w-3 h-3 mr-1.5 inline-block"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{`${entry.name} (${((entry.value / total) * 100).toFixed(1)}%)`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}