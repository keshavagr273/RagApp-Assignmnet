import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Table, BarChart3 } from 'lucide-react';

interface ChartSeries {
  name: string;
  data: Array<{ x: string | number; y: number; label?: string }>;
  unit?: string;
}

interface ChartAnswerProps {
  chart: {
    chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'other';
    title?: string;
    xAxisLabel?: string;
    xAxisUnit?: string;
    yAxisLabel?: string;
    yAxisUnit?: string;
    series: ChartSeries[];
    summary?: string;
    estimatedValues?: boolean;
  };
}

const FLAT_PALETTE = ['#1F4D3A', '#B4532A', '#2F5D8A', '#C79A2B', '#6E5A7E', '#7A8B6F'];

export const ChartAnswer: React.FC<ChartAnswerProps> = ({ chart }) => {
  const [showTable, setShowTable] = useState(false);

  // Transform series data into Recharts tabular format
  const xCategories = Array.from(
    new Set(
      chart.series.flatMap((s) => s.data.map((d) => String(d.x)))
    )
  );

  const chartData = xCategories.map((xVal) => {
    const row: Record<string, any> = { x: xVal };
    chart.series.forEach((s) => {
      const point = s.data.find((d) => String(d.x) === xVal);
      row[s.name] = point ? point.y : null;
    });
    return row;
  });

  const isPie = chart.chartType === 'pie' || (chart.series.length === 1 && chart.series[0].data.length <= 5 && chart.chartType !== 'line');
  const pieData = isPie && chart.series[0] ? chart.series[0].data.map((d) => ({ name: String(d.x), value: d.y })) : [];

  return (
    <div className="my-4 border border-hairline rounded bg-surface p-4">
      <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2">
        <div>
          <h4 className="font-display font-medium text-sm text-ink">{chart.title || 'Extracted Visualization'}</h4>
          {chart.summary && <p className="text-xs text-muted mt-0.5">{chart.summary}</p>}
          {chart.estimatedValues && (
            <span className="inline-block mt-1 text-[11px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
              Values visually estimated from chart
            </span>
          )}
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-muted hover:text-ink hover:bg-hairline/30 rounded border border-hairline transition-colors"
        >
          {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
          <span>{showTable ? 'View Chart' : 'View Data Table'}</span>
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-paper border-b border-hairline">
              <tr>
                <th className="px-3 py-1.5 font-medium text-ink">{chart.xAxisLabel || 'Category'}</th>
                {chart.series.map((s, i) => (
                  <th key={i} className="px-3 py-1.5 font-medium text-ink text-right">
                    {s.name} {s.unit ? `(${s.unit})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-hairline/60">
                  <td className="px-3 py-1.5 text-ink font-medium">{row.x}</td>
                  {chart.series.map((s, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-right font-mono tabular-nums text-ink">
                      {row[s.name] !== null ? row[s.name] : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {isPie && pieData.length > 0 ? (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={FLAT_PALETTE[index % FLAT_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DDD7CA',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : chart.chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="#DDD7CA" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="x"
                  tickLine={false}
                  axisLine={{ stroke: '#DDD7CA' }}
                  tick={{ fill: '#6B665C', fontSize: 11 }}
                  label={chart.xAxisLabel ? { value: chart.xAxisLabel, position: 'bottom', offset: 0, fill: '#6B665C', fontSize: 11 } : undefined}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#DDD7CA' }}
                  tick={{ fill: '#6B665C', fontSize: 11 }}
                  label={chart.yAxisLabel ? { value: chart.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#6B665C', fontSize: 11 } : undefined}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DDD7CA',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                {chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {chart.series.map((s, i) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={FLAT_PALETTE[i % FLAT_PALETTE.length]}
                    strokeWidth={2}
                    dot={{ fill: FLAT_PALETTE[i % FLAT_PALETTE.length], r: 4 }}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="#DDD7CA" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="x"
                  tickLine={false}
                  axisLine={{ stroke: '#DDD7CA' }}
                  tick={{ fill: '#6B665C', fontSize: 11 }}
                  label={chart.xAxisLabel ? { value: chart.xAxisLabel, position: 'bottom', offset: 0, fill: '#6B665C', fontSize: 11 } : undefined}
                />
                <YAxis
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={{ stroke: '#DDD7CA' }}
                  tick={{ fill: '#6B665C', fontSize: 11 }}
                  label={chart.yAxisLabel ? { value: chart.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#6B665C', fontSize: 11 } : undefined}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DDD7CA',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                {chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                {chart.series.map((s, i) => (
                  <Bar
                    key={s.name}
                    dataKey={s.name}
                    fill={FLAT_PALETTE[i % FLAT_PALETTE.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

