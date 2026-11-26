export const parseAppointmentDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    const cleanDate = String(dateStr).includes("T")
      ? String(dateStr).split("T")[0]
      : String(dateStr);
    const cleanTime = timeStr ? String(timeStr).trim() : "00:00";
    const dt = new Date(`${cleanDate}T${cleanTime}`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
};

export const isAppointmentOverdue = (appointment, now = new Date()) => {
  if (!appointment || appointment.Checkup_Status === "Complete") return false;
  const dt = parseAppointmentDateTime(
    appointment.AppointmentDate,
    appointment.AppointmentTime
  );
  return Boolean(dt && dt < now);
};

export const getAppointmentStatusLabel = (appointment, now = new Date()) => {
  if (!appointment) return "Pending";
  if (appointment.Checkup_Status === "Complete") return "Complete";
  if (isAppointmentOverdue(appointment, now)) return "Overdue";
  return appointment.Checkup_Status || "Pending";
};

export const getAppointmentStatusBadgeClass = (appointment, now = new Date()) => {
  const status = getAppointmentStatusLabel(appointment, now);
  if (status === "Complete") return "ts-badge-ok";
  if (status === "Overdue") return "ts-badge-warn";
  return "ts-badge-accent";
};
