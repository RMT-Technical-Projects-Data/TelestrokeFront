import React, { useState } from "react";
import { Plus } from "lucide-react";
import AppShell from "../components/AppShell";
import AppointmentTable from "../components/AppointmentTable";
import AppointmentForm from "../components/AppointmentForm";

const AppointmentsPage = () => {
  const [appointments_data, setAppointmentsData] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const addAppointment = () => setShowForm(true);

  const saveAppointment = (appointment) => {
    setAppointmentsData([...appointments_data, appointment]);
    setShowForm(false);
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
        appointments_data={appointments_data}
        addAppointment={addAppointment}
        hideHeader
      />
      {showForm && (
        <AppointmentForm
          saveAppointment={saveAppointment}
          close={closeForm}
          appointments_data={appointments_data}
        />
      )}
    </AppShell>
  );
};

export default AppointmentsPage;
