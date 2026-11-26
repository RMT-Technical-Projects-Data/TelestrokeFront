import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CalendarCheck,
  Clock,
  AlertTriangle,
  Plus,
  Video,
  Percent,
  CalendarDays,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut, PolarArea } from "react-chartjs-2";
import AppShell from "../components/AppShell";
import { getAllAppointments, parseAppointmentList } from "../utils/auth";
import { buildAppointmentInsights } from "../utils/overviewInsights";
import { isAppointmentOverdue } from "../utils/appointmentStatus";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

const MetricSkeleton = ({ count = 6 }) => (
  <div className="ts-metrics">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="ts-metric">
        <span className="ts-skel-circle" style={{ width: 36, height: 36 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="ts-skel-bar" style={{ width: "42%", height: "0.55rem" }} />
          <span className="ts-skel-bar" style={{ width: "58%", height: "1.25rem", marginTop: "0.45rem" }} />
        </div>
      </div>
    ))}
  </div>
);

const ChartCard = ({ title, meta, children, wide = false }) => (
  <div className={`ts-panel ${wide ? "ts-chart-wide" : ""}`}>
    <div className="ts-panel-head">
      <h3 className="ts-panel-title">{title}</h3>
      {meta ? <span className="ts-panel-meta">{meta}</span> : null}
    </div>
    <div className="ts-chart-body ts-chart-canvas-wrap">{children}</div>
  </div>
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { boxWidth: 12, usePointStyle: true, padding: 16 },
    },
  },
};

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const variant = localStorage.getItem("role") === "admin" ? "admin" : "user";

  const insights = useMemo(() => buildAppointmentInsights(appointments), [appointments]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        const Doctor = localStorage.getItem("Doctor");
        const result = await getAllAppointments(Doctor);
        const data = parseAppointmentList(result);
        setAppointments(data);

        const overdue = data.filter((a) => isAppointmentOverdue(a));
        const alreadyShown = sessionStorage.getItem("tsOverdueToastShown") === "1";
        if (
          overdue.length > 0 &&
          !alreadyShown &&
          localStorage.getItem("tsOverdueAlerts") !== "off"
        ) {
          sessionStorage.setItem("tsOverdueToastShown", "1");
          toast.warn(`Reminder: You have ${overdue.length} overdue appointment(s) pending.`);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const volumeLine = useMemo(
    () => ({
      labels: insights.volume.map((d) => d.label),
      datasets: [
        {
          label: "Appointments",
          data: insights.volume.map((d) => d.value),
          borderColor: "#3b4fdf",
          backgroundColor: "rgba(59, 79, 223, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2.5,
        },
      ],
    }),
    [insights.volume]
  );

  const volumeBars = useMemo(
    () => ({
      labels: insights.volume.map((d) => d.key.slice(8)),
      datasets: [
        {
          label: "Daily volume",
          data: insights.volume.map((d) => d.value),
          backgroundColor: "rgba(59, 79, 223, 0.75)",
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    }),
    [insights.volume]
  );

  const statusDoughnut = useMemo(
    () => ({
      labels: ["Attended", "Scheduled", "Overdue"],
      datasets: [
        {
          data: [insights.complete, insights.pending, insights.overdue],
          backgroundColor: ["#16a34a", "#3b4fdf", "#dc2626"],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [insights.complete, insights.pending, insights.overdue]
  );

  const deviceBars = useMemo(
    () => ({
      labels: insights.deviceBars.map((d) => d.label),
      datasets: [
        {
          label: "Appointments by device",
          data: insights.deviceBars.map((d) => d.value),
          backgroundColor: [
            "#3b4fdf",
            "#0ea5e9",
            "#14b8a6",
            "#f59e0b",
            "#8b5cf6",
            "#ef4444",
          ],
          borderRadius: 8,
          maxBarThickness: 36,
        },
      ],
    }),
    [insights.deviceBars]
  );

  const weeklyPolar = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    appointments.forEach((a) => {
      const dt = a.AppointmentDate ? new Date(a.AppointmentDate) : null;
      if (!dt || Number.isNaN(dt.getTime())) return;
      buckets[dt.getDay()] += 1;
    });
    return {
      labels,
      datasets: [
        {
          label: "By weekday",
          data: buckets,
          backgroundColor: [
            "rgba(59, 79, 223, 0.55)",
            "rgba(14, 165, 233, 0.55)",
            "rgba(20, 184, 166, 0.55)",
            "rgba(245, 158, 11, 0.55)",
            "rgba(139, 92, 246, 0.55)",
            "rgba(239, 68, 68, 0.55)",
            "rgba(100, 116, 139, 0.55)",
          ],
        },
      ],
    };
  }, [appointments]);

  const trendCompare = useMemo(() => {
    const half = Math.floor(insights.volume.length / 2);
    const recent = insights.volume.slice(half);
    const earlier = insights.volume.slice(0, half);
    return {
      labels: recent.map((d) => d.label),
      datasets: [
        {
          label: "Recent 7 days",
          data: recent.map((d) => d.value),
          borderColor: "#3b4fdf",
          backgroundColor: "rgba(59, 79, 223, 0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
        },
        {
          label: "Prior 7 days",
          data: earlier.map((d) => d.value),
          borderColor: "#94a3b8",
          backgroundColor: "rgba(148, 163, 184, 0.12)",
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderDash: [5, 4],
        },
      ],
    };
  }, [insights.volume]);

  return (
    <AppShell
      variant={variant}
      page="DASHBOARD"
      title="Overview"
      subtitle="Caseload analytics and appointment trends."
      actions={
        <>
          <Link to="/meeting" className="ts-btn ts-btn-ghost">
            <Video size={16} /> Instant meeting
          </Link>
          <Link to="/appointment" className="ts-btn ts-btn-primary">
            <Plus size={16} /> Schedule appointment
          </Link>
        </>
      }
    >
      <div className="ts-stack">
        {loading ? (
          <MetricSkeleton />
        ) : (
          <div className="ts-metrics">
            <div className="ts-metric">
              <div className="ts-metric-icon"><Calendar size={18} /></div>
              <div>
                <p className="ts-metric-label">Total</p>
                <p className="ts-metric-value">{insights.total}</p>
              </div>
            </div>
            <div className="ts-metric">
              <div className="ts-metric-icon"><CalendarCheck size={18} /></div>
              <div>
                <p className="ts-metric-label">Attended</p>
                <p className="ts-metric-value">{insights.complete}</p>
              </div>
            </div>
            <div className="ts-metric">
              <div className="ts-metric-icon"><Clock size={18} /></div>
              <div>
                <p className="ts-metric-label">Scheduled</p>
                <p className="ts-metric-value">{insights.pending}</p>
              </div>
            </div>
            <div className="ts-metric">
              <div className="ts-metric-icon"><AlertTriangle size={18} /></div>
              <div>
                <p className="ts-metric-label">Overdue</p>
                <p className="ts-metric-value">{insights.overdue}</p>
              </div>
            </div>
            <div className="ts-metric">
              <div className="ts-metric-icon"><CalendarDays size={18} /></div>
              <div>
                <p className="ts-metric-label">Today</p>
                <p className="ts-metric-value">{insights.todayCount}</p>
              </div>
            </div>
            <div className="ts-metric">
              <div className="ts-metric-icon"><Percent size={18} /></div>
              <div>
                <p className="ts-metric-label">Completed</p>
                <p className="ts-metric-value">{insights.completionRate}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="ts-chart-grid">
          <ChartCard title="Appointment trend" meta="14-day line" wide>
            {loading ? (
              <div className="ts-chart-empty">Loading chart…</div>
            ) : (
              <Line
                data={volumeLine}
                options={{
                  ...chartDefaults,
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,0.2)" } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            )}
          </ChartCard>

          <ChartCard title="Daily volume" meta="Bar chart">
            {loading ? (
              <div className="ts-chart-empty">Loading chart…</div>
            ) : (
              <Bar
                data={volumeBars}
                options={{
                  ...chartDefaults,
                  plugins: { ...chartDefaults.plugins, legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,0.2)" } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            )}
          </ChartCard>

          <ChartCard title="Status mix" meta="Doughnut">
            {loading ? (
              <div className="ts-chart-empty">Loading chart…</div>
            ) : insights.total === 0 ? (
              <div className="ts-chart-empty">No status data yet</div>
            ) : (
              <Doughnut
                data={statusDoughnut}
                options={{
                  ...chartDefaults,
                  cutout: "62%",
                }}
              />
            )}
          </ChartCard>

          <ChartCard title="Device usage" meta="Horizontal bars">
            {loading ? (
              <div className="ts-chart-empty">Loading chart…</div>
            ) : insights.deviceBars.length === 0 ? (
              <div className="ts-chart-empty">No device data yet</div>
            ) : (
              <Bar
                data={deviceBars}
                options={{
                  ...chartDefaults,
                  indexAxis: "y",
                  plugins: { ...chartDefaults.plugins, legend: { display: false } },
                  scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,0.2)" } },
                    y: { grid: { display: false } },
                  },
                }}
              />
            )}
          </ChartCard>

          <ChartCard title="Weekday distribution" meta="Polar area">
            {loading ? (
              <div className="ts-chart-empty">Loading chart…</div>
            ) : insights.total === 0 ? (
              <div className="ts-chart-empty">No weekday data yet</div>
            ) : (
              <PolarArea
                data={weeklyPolar}
                options={{
                  ...chartDefaults,
                  scales: {
                    r: {
                      beginAtZero: true,
                      ticks: { precision: 0, backdrop: false },
                      grid: { color: "rgba(148,163,184,0.25)" },
                    },
                  },
                }}
              />
            )}
          </ChartCard>

          <ChartCard title="Trend comparison" meta="Recent vs prior week" wide>
            {loading ? (
              <div className="ts-chart-empty">Loading chart…</div>
            ) : (
              <Line
                data={trendCompare}
                options={{
                  ...chartDefaults,
                  scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,0.2)" } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            )}
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}

export default Dashboard;
