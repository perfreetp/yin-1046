import { useState, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  BarChart,
  PieChart,
} from "lucide-react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatCard from "@/components/business/StatCard";
import { useStore } from "@/store/useStore";
import { getWeekDates, getWeekdayName, formatDateDisplay, getDurationMinutes } from "@/utils/dateUtils";
import { exportWeeklySchedule } from "@/utils/exportUtils";

const Statistics = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const applications = useStore((state) => state.applications);
  const venues = useStore((state) => state.venues);

  const weekDates = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    return getWeekDates(baseDate);
  }, [weekOffset]);

  const weekStart = formatDateDisplay(weekDates[0]);
  const weekEnd = formatDateDisplay(weekDates[6]);

  const weekApplications = useMemo(() => {
    return applications.filter(
      (a) => weekDates.includes(a.date) && a.status === "approved"
    );
  }, [applications, weekDates]);

  const utilizationStats = useMemo(() => {
    return venues.map((venue) => {
      const venueApps = weekApplications.filter((a) => a.venueId === venue.id);
      const totalMinutes = venueApps.reduce(
        (sum, app) => sum + getDurationMinutes(app.startTime, app.endTime),
        0
      );
      const totalAvailableMinutes = 7 * 14 * 60;
      const utilizationRate = Math.round((totalMinutes / totalAvailableMinutes) * 100);
      const vacancyRate = 100 - utilizationRate;

      return {
        venueId: venue.id,
        venueName: venue.name,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        utilizationRate,
        vacancyRate,
      };
    });
  }, [venues, weekApplications]);

  const hourlyStats = useMemo(() => {
    const stats: { hour: number; count: number }[] = [];
    for (let h = 8; h <= 22; h++) {
      const count = weekApplications.filter((app) => {
        const startHour = parseInt(app.startTime.split(":")[0]);
        const endHour = parseInt(app.endTime.split(":")[0]);
        return h >= startHour && h < endHour;
      }).length;
      stats.push({ hour: h, count });
    }
    return stats;
  }, [weekApplications]);

  const dailyStats = useMemo(() => {
    return weekDates.map((date) => {
      const count = weekApplications.filter((a) => a.date === date).length;
      const totalMinutes = weekApplications
        .filter((a) => a.date === date)
        .reduce((sum, app) => sum + getDurationMinutes(app.startTime, app.endTime), 0);
      return {
        date,
        weekday: getWeekdayName(date),
        count,
        hours: Math.round(totalMinutes / 60 * 10) / 10,
      };
    });
  }, [weekDates, weekApplications]);

  const totalRehearsals = weekApplications.length;
  const totalHours = Math.round(
    weekApplications.reduce(
      (sum, app) => sum + getDurationMinutes(app.startTime, app.endTime),
      0
    ) / 60 * 10
  ) / 10;
  const avgUtilizationRate = Math.round(
    utilizationStats.reduce((sum, s) => sum + s.utilizationRate, 0) / utilizationStats.length
  );
  const peakHour = hourlyStats.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    hourlyStats[0]
  );

  const PIE_COLORS = ["#1e3a5f", "#2563eb", "#0ea5e9", "#06b6d4", "#14b8a6", "#22c55e", "#eab308", "#f97316"];

  const handleExport = () => {
    exportWeeklySchedule(applications, weekDates);
  };

  const prevWeek = () => setWeekOffset((w) => w - 1);
  const nextWeek = () => setWeekOffset((w) => w + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">统计报表</h2>
          <p className="text-sm text-slate-500 mt-1">
            场地利用率、空置率与高峰时段统计分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-slate-50 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700">
              {weekStart} - {weekEnd}
            </span>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-slate-50 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出周排练表
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="本周排练场次"
          value={`${totalRehearsals} 场`}
          icon={Calendar}
          color="primary"
          trend={{ value: 15, isUp: true }}
        />
        <StatCard
          title="总排练时长"
          value={`${totalHours} 小时`}
          icon={Clock}
          color="success"
          trend={{ value: 8, isUp: true }}
        />
        <StatCard
          title="平均利用率"
          value={`${avgUtilizationRate}%`}
          icon={TrendingUp}
          color="warning"
          trend={{ value: 5, isUp: true }}
        />
        <StatCard
          title="高峰时段"
          value={`${peakHour.hour}:00`}
          icon={Users}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                各场地利用率统计
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {utilizationStats.map((stat, index) => (
                  <div key={stat.venueId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{stat.venueName}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{stat.totalHours} 小时</span>
                        <span className="font-semibold text-primary-600">{stat.utilizationRate}%</span>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stat.utilizationRate}%`,
                          backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div>
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-primary-600" />
                场地使用占比
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={utilizationStats.filter(s => s.totalHours > 0)}
                      dataKey="totalHours"
                      nameKey="venueName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {utilizationStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} 小时`, "使用时长"]}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-primary-600" />
              每日排练场次
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="weekday"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number) => [`${value} 场`, "排练场次"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar
                    dataKey="count"
                    fill="#1e3a5f"
                    radius={[4, 4, 0, 0]}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary-600" />
              高峰时段分布
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number) => [`${value} 场`, "排练场次"]}
                    labelFormatter={(label) => `${label}:00`}
                  />
                  <Bar
                    dataKey="count"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary-600" />
            详细统计数据
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">场地名称</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">使用时长</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">排练场次</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">利用率</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-600">空置率</th>
                </tr>
              </thead>
              <tbody>
                {utilizationStats.map((stat) => {
                  const venueAppCount = weekApplications.filter(
                    (a) => a.venueId === stat.venueId
                  ).length;
                  return (
                    <tr key={stat.venueId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-700">{stat.venueName}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{stat.totalHours} 小时</td>
                      <td className="py-3 px-4 text-center text-slate-600">{venueAppCount} 场</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${
                          stat.utilizationRate >= 60 ? "text-success-600" :
                          stat.utilizationRate >= 30 ? "text-warning-600" : "text-slate-500"
                        }`}>
                          {stat.utilizationRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">{stat.vacancyRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Statistics;
