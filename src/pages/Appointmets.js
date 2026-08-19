import React, { useState } from "react";
import { Plus } from "lucide-react";
import AppShell from "../components/AppShell";
import AppointmentTable from "../components/AppointmentTable";
import AppointmentForm from "../components/AppointmentForm";

const AppointmentsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const addAppointment = () => setShowForm(true);

  const saveAppointment = () => {
    setShowForm(false);
    setReloadKey((key) => key + 1);
  };

  const closeForm = () => setShowForm(false);

  return (
    <AppShell
      page="APPOINTMENTS"
      title="Appointments"
      subtitle="Schedule, join, and manage remote exam sessions."
      actions={
        !showForm ? (
          <button type="button" className="ts-btn ts-btn-primary" onClick={addAppointment}>
            <Plus size={16} /> Add Appointment
          </button>
        ) : null
      }
    >
      <AppointmentTable
        addAppointment={addAppointment}
        hideHeader
        reloadKey={reloadKey}
      />
      {showForm && (
        <AppointmentForm
          saveAppointment={saveAppointment}
          close={closeForm}
        />
      )}
    </AppShell>
  );
};

export default AppointmentsPage;
