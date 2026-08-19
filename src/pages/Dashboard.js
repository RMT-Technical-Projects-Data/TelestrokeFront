import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CalendarCheck, Clock, AlertTriangle, Plus, Video, Percent, CalendarDays, Monitor } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppShell from "../components/AppShell";
import { getAllAppointments } from "../utils/auth";
import { buildAppointmentInsights } from "../utils/overviewInsights";

const EmptyState = ({ icon: Icon, title, text, to, action }) => (
  <div className="ts-empty-state">
    <div className="ts-empty-icon"><Icon size={20} /></div>
    <strong>{title}</strong>
    <p>{text}</p>
    {to ? (
      <Link to={to} className="ts-btn ts-btn-primary">
        {action}
      </Link>
    ) : null}
  </div>
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

const isOverdue = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  try {
    const today = new Date();
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    return new Date(`${cleanDate}T${timeStr}`) < today;
  } catch {
    return false;
  }
};

const formatTime = (time) => {
  if (!time) return "N/A";
  const [hour, minute] = time.split(":") || [];
  const hourNum = parseInt(hour, 10);
  if (Number.isNaN(hourNum)) return time;
  const isPM = hourNum >= 12;
  const formattedHour = hourNum % 12 || 12;
  return `${formattedHour}:${minute} ${isPM ? "PM" : "AM"}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const variant = localStorage.getItem("role") === "admin" ? "admin" : "user";

  const insights = useMemo(() => buildAppointmentInsights(appointments), [appointments]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const Doctor = localStorage.getItem("Doctor");
        const result = await getAllAppointments(Doctor);

        let data = [];
        if (Array.isArray(result)) data = result;
        else if (result && Array.isArray(result.data)) data = result.data;
        else if (result && Array.isArray(result.appointments)) data = result.appointments;

        setAppointments(data);

        const overdue = data.filter(
          (a) => a.Checkup_Status !== "Complete" && isOverdue(a.AppointmentDate, a.AppointmentTime)
        );
        if (overdue.length > 0 && localStorage.getItem("tsOverdueAlerts") !== "off") {
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

  return (
    <AppShell
      variant={variant}
      page="DASHBOARD"
      title="Overview"
      subtitle="Caseload, appointment volume, and upcoming sessions."
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

        <div className="ts-quick-links">
          <Link to="/appointment" className="ts-btn ts-btn-ghost">All appointments</Link>
          <Link to="/meeting" className="ts-btn ts-btn-ghost">Create meeting</Link>
          <Link to="/emr" className="ts-btn ts-btn-ghost">EMR reports</Link>
          <Link to="/settings" className="ts-btn ts-btn-ghost">Settings</Link>
        </div>

        <div className="ts-chart-grid">
          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Appointments · 14 days</h3>
              <span className="ts-panel-meta">{insights.thisWeek} this week</span>
            </div>
            <div className="ts-chart-body">
              {loading ? (
                <div className="ts-chart-empty">Loading chart…</div>
              ) : insights.total === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No appointments yet"
                  text="Schedule a session or start an instant meeting to see 14-day volume here."
                  to="/appointment"
                  action="Schedule appointment"
                />
              ) : (
                <div className="ts-bar-chart" role="img" aria-label="Appointments over the last 14 days">
                  {insights.volume.map((day) => (
                    <div key={day.key} className="ts-bar-col" title={`${day.label}: ${day.value}`}>
                      <div className="ts-bar-track">
                        <div
                          className="ts-bar-fill"
                          style={{ height: `${Math.max(day.value ? 8 : 0, (day.value / insights.volMax) * 100)}%` }}
                        />
                      </div>
                      <span className="ts-bar-label">{day.key.slice(8)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Status mix</h3>
              <span className="ts-panel-meta">{insights.total} appointments</span>
            </div>
            <div className="ts-chart-body">
              {loading ? (
                <div className="ts-chart-empty">Loading chart…</div>
              ) : insights.total === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No status mix yet"
                  text="Attended, scheduled, and overdue shares appear after the first appointment is saved."
                  to="/meeting"
                  action="Create meeting"
                />
              ) : (
                <div className="ts-hbars">
                  {insights.statusBars.map((row) => (
                    <div key={row.label} className="ts-hbar-row">
                      <div className="ts-hbar-meta">
                        <span>{row.label}</span>
                        <strong>{row.value} · {row.pct}%</strong>
                      </div>
                      <div className="ts-hbar-track">
                        <div className="ts-hbar-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ts-chart-grid">
          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Today’s schedule</h3>
              <span className="ts-panel-meta">{loading ? "Loading…" : `${insights.todayCount} sessions`}</span>
            </div>
            {loading || insights.today.length > 0 ? (
            <div className="ts-table-wrap">
              <table className="ts-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Time</th>
                    <th>Device</th>
                    <th className="ts-col-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="ts-empty">Loading today’s sessions…</td>
                    </tr>
                  ) : (
                    insights.today.map((a) => {
                      const overdue = isOverdue(a.AppointmentDate, a.AppointmentTime);
                      const done = a.Checkup_Status === "Complete";
                      return (
                        <tr key={`today-${a.ID || a._id}`}>
                          <td>
                            <strong>{String(a.ID ?? "—").padStart(5, "0")}</strong>
                          </td>
                          <td>{formatTime(a.AppointmentTime)}</td>
                          <td className="ts-muted">{a.DeviceID || "—"}</td>
                          <td className="ts-col-center">
                            <span className={`ts-badge ${done ? "ts-badge-ok" : overdue ? "ts-badge-warn" : "ts-badge-accent"}`}>
                              {done ? "Complete" : overdue ? "Overdue" : a.Checkup_Status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Nothing on today’s list"
                text="Create an instant meeting or schedule an appointment to fill this board."
                to="/meeting"
                action="Start instant meeting"
              />
            )}
          </div>

          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Device mix</h3>
              <span className="ts-panel-meta">{insights.total} appointments</span>
            </div>
            <div className="ts-chart-body">
              {loading ? (
                <div className="ts-chart-empty">Loading chart…</div>
              ) : insights.deviceBars.length > 0 ? (
                <div className="ts-hbars">
                  {insights.deviceBars.map((row) => (
                    <div key={row.label} className="ts-hbar-row">
                      <div className="ts-hbar-meta">
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                      <div className="ts-hbar-track">
                        <div
                          className="ts-hbar-fill"
                          style={{ width: `${Math.round((row.value / insights.deviceMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Monitor}
                  title="No device mix yet"
                  text="Device usage appears here once appointments are linked to a device ID."
                  to="/appointment"
                  action="Schedule appointment"
                />
              )}
            </div>
          </div>
        </div>

        <div className="ts-panel">
          <div className="ts-panel-head">
            <h3 className="ts-panel-title">Upcoming appointments</h3>
            <span className="ts-panel-meta">
              {loading ? "Loading…" : `next ${insights.upcoming.length}`}
            </span>
          </div>
          {loading || insights.upcoming.length > 0 ? (
            <div className="ts-table-wrap">
              <table className="ts-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Device</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th className="ts-col-center">Status</th>
                    <th className="ts-col-center">Join</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="ts-empty">Loading appointments…</td>
                    </tr>
                  ) : (
                    insights.upcoming.map((a) => {
                      const overdue = isOverdue(a.AppointmentDate, a.AppointmentTime);
                      return (
                        <tr key={a.ID || a._id}>
                          <td>
                            <div className="ts-user-cell">
                              <div className="ts-avatar">{String(a.ID || "?").slice(-2)}</div>
                              <div>
                                <strong>{String(a.ID ?? "—").padStart(5, "0")}</strong>
                              </div>
                            </div>
                          </td>
                          <td className="ts-muted">{a.DeviceID || "—"}</td>
                          <td>{formatDate(a.AppointmentDate)}</td>
                          <td>{formatTime(a.AppointmentTime)}</td>
                          <td className="ts-col-center">
                            <span className={`ts-badge ${overdue ? "ts-badge-warn" : "ts-badge-accent"}`}>
                              {overdue ? "Overdue" : a.Checkup_Status || "Pending"}
                            </span>
                          </td>
                          <td className="ts-col-center">
                            {a.meetingId ? (
                              <Link to={`/emr/${a.ID}/${a.meetingId}`} className="ts-btn ts-btn-primary">
                                Join
                              </Link>
                            ) : (
                              <span className="ts-muted">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointments"
              text="Schedule a remote exam to populate this list, or start an instant meeting now."
              to="/appointment"
              action="Schedule appointment"
            />
          )}
        </div>

        <div className="ts-panel">
          <div className="ts-panel-head">
            <h3 className="ts-panel-title">Recently completed</h3>
            <span className="ts-panel-meta">
              {loading ? "Loading…" : `${insights.completedRecent.length} latest`}
            </span>
          </div>
          {loading || insights.completedRecent.length > 0 ? (
            <div className="ts-table-wrap">
              <table className="ts-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Device</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th className="ts-col-center">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="ts-empty">Loading completed exams…</td>
                    </tr>
                  ) : (
                    insights.completedRecent.map((a) => (
                      <tr key={`done-${a.ID || a._id}`}>
                        <td>
                          <strong>{String(a.ID ?? "—").padStart(5, "0")}</strong>
                        </td>
                        <td className="ts-muted">{a.DeviceID || "—"}</td>
                        <td>{formatDate(a.AppointmentDate)}</td>
                        <td>{formatTime(a.AppointmentTime)}</td>
                        <td className="ts-col-center">
                          <Link to="/emr" className="ts-btn ts-btn-ghost">EMR</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No completed exams yet"
              text="Finished sessions will show here with a shortcut to the EMR report."
              to="/emr"
              action="Open EMR reports"
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default Dashboard;
