import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface ProgressData {
  date: string;
  score: number;
  gamesPlayed: number;
  timeSpent: number; // in minutes
}

export default function ProgressChart() {
  const { data: progressData, isLoading } = useQuery<ProgressData[]>({
    queryKey: ['/api/progress/weekly'],
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!progressData || progressData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">¡Comienza a jugar para ver tu progreso!</p>
        </div>
      </div>
    );
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Puntuación promedio: <span className="font-bold">{data.score}%</span>
            </p>
            <p className="text-green-600">
              Juegos jugados: <span className="font-bold">{data.gamesPlayed}</span>
            </p>
            <p className="text-purple-600">
              Tiempo total: <span className="font-bold">{data.timeSpent} min</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
  };

  const formattedData = progressData.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  return (
    <div className="space-y-6">
      {/* Score Progress Line Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Evolución de puntuaciones
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
                label={{ value: 'Puntuación (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Games Played Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Actividad diaria
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                label={{ value: 'Juegos', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === 'gamesPlayed' ? 'Juegos jugados' : name
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db' }}
              />
              <Bar 
                dataKey="gamesPlayed" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(progressData.reduce((acc, item) => acc + item.score, 0) / progressData.length)}%
          </div>
          <div className="text-sm text-gray-600">Promedio semanal</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {progressData.reduce((acc, item) => acc + item.gamesPlayed, 0)}
          </div>
          <div className="text-sm text-gray-600">Total juegos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {progressData.reduce((acc, item) => acc + item.timeSpent, 0)}
          </div>
          <div className="text-sm text-gray-600">Minutos jugados</div>
        </div>
      </div>
    </div>
  );
}
