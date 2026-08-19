const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const localDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseAppointmentDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    if (timeStr) return new Date(`${cleanDate}T${timeStr}`);
    return new Date(`${cleanDate}T00:00:00`);
  } catch {
    return null;
  }
};

export const buildAppointmentInsights = (appointments = []) => {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const list = Array.isArray(appointments) ? appointments : [];

  const complete = list.filter((a) => a.Checkup_Status === "Complete").length;
  const pending = list.length - complete;

  const overdue = list.filter((a) => {
    if (a.Checkup_Status === "Complete") return false;
    const dt = parseAppointmentDate(a.AppointmentDate, a.AppointmentTime);
    return dt && dt < now;
  }).length;

  const days = 14;
  const volume = Array.from({ length: days }, (_, i) => {
    const d = new Date(startOfDay(now).getTime() - (days - 1 - i) * dayMs);
    return {
      key: localDateKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
    };
  });
  const byKey = Object.fromEntries(volume.map((r) => [r.key, r]));

  let thisWeek = 0;
  list.forEach((a) => {
    const dt = parseAppointmentDate(a.AppointmentDate, a.AppointmentTime);
    if (!dt || Number.isNaN(dt.getTime())) return;
    const key = localDateKey(startOfDay(dt));
    if (byKey[key]) byKey[key].value += 1;
    if (now.getTime() - dt.getTime() <= 7 * dayMs && dt.getTime() <= now.getTime()) {
      thisWeek += 1;
    }
  });

  const volMax = Math.max(1, ...volume.map((d) => d.value));
  const statusTotal = complete + pending || 1;
  const statusBars = [
    { label: "Attended", value: complete, color: "var(--ts-accent)" },
    { label: "Scheduled", value: pending, color: "var(--ts-navy)" },
    { label: "Overdue", value: overdue, color: "#dc2626" },
  ].map((row) => ({ ...row, pct: Math.round((row.value / statusTotal) * 100) }));

  const upcoming = [...list]
    .filter((a) => a.Checkup_Status !== "Complete")
    .sort((a, b) => {
      const da = parseAppointmentDate(a.AppointmentDate, a.AppointmentTime) || new Date(0);
      const db = parseAppointmentDate(b.AppointmentDate, b.AppointmentTime) || new Date(0);
      return da - db;
    })
    .slice(0, 8);

  const todayKey = localDateKey(now);
  const today = list
    .filter((a) => {
      const dt = parseAppointmentDate(a.AppointmentDate, a.AppointmentTime);
      return dt && localDateKey(startOfDay(dt)) === todayKey;
    })
    .sort((a, b) => {
      const da = parseAppointmentDate(a.AppointmentDate, a.AppointmentTime) || new Date(0);
      const db = parseAppointmentDate(b.AppointmentDate, b.AppointmentTime) || new Date(0);
      return da - db;
    });

  const byDevice = new Map();
  list.forEach((a) => {
    const name = a.DeviceID || "Unassigned";
    const row = byDevice.get(name) || { label: name, value: 0 };
    row.value += 1;
    byDevice.set(name, row);
  });
  const deviceBars = Array.from(byDevice.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const deviceMax = Math.max(1, ...deviceBars.map((d) => d.value), 1);

  const completionRate = list.length ? Math.round((complete / list.length) * 100) : 0;

  const completedRecent = [...list]
    .filter((a) => a.Checkup_Status === "Complete")
    .sort((a, b) => {
      const da = parseAppointmentDate(a.AppointmentDate, a.AppointmentTime) || new Date(0);
      const db = parseAppointmentDate(b.AppointmentDate, b.AppointmentTime) || new Date(0);
      return db - da;
    })
    .slice(0, 6);

  return {
    total: list.length,
    complete,
    pending,
    overdue,
    thisWeek,
    todayCount: today.length,
    today,
    completionRate,
    volume,
    volMax,
    statusBars,
    deviceBars,
    deviceMax,
    upcoming,
    completedRecent,
  };
};
