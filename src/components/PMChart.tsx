import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface PMChartProps {
  hourlyData: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
  };
}

export default function PMChart({ hourlyData }: PMChartProps) {
  if (!hourlyData || !hourlyData.time) return null;

  // Get the last 24 hours of data
  const now = new Date();
  const data = hourlyData.time.map((t, i) => ({
    time: t,
    pm25: hourlyData.pm2_5[i],
    pm10: hourlyData.pm10[i],
  })).filter(d => {
    const dTime = new Date(d.time);
    const diffHours = (now.getTime() - dTime.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  });

  return (
    <div className="w-full h-64 mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPm10" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            tickFormatter={(timeStr) => format(parseISO(timeStr), 'ha')}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#888' }}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#888' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelFormatter={(label) => format(parseISO(label as string), 'MMM d, h:mm a')}
          />
          <Area type="monotone" dataKey="pm10" name="PM10" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPm10)" />
          <Area type="monotone" dataKey="pm25" name="PM2.5" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPm25)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
