// PatientReportModal.js
import React from 'react';

const PatientReportModal = ({ patientData, closeModal }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-lg w-3/4 max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Patient Report</h2>
        <div className="mb-2">Patient ID: {patientData.patientid}</div>
        <div className="mb-2">Date of Birth: {new Date(patientData.patientDOB).toLocaleDateString()}</div>
        <div className="mb-2">Sex: {patientData.patientSex}</div>
        <div className="mb-2">Exam Date: {new Date(patientData.examDate).toLocaleDateString()}</div>
        <div className="mb-2">Visual Activity OD: {patientData.visualActivityOD}</div>
        <div className="mb-2">Visual Activity OS: {patientData.visualActivityOS}</div>
        <div className="mb-2">RelNeurological Findings: {patientData.neuroFindings}</div>
        <div className="mb-2">Has Aphasia: {patientData.hasAphasia}</div>
        <div className="mb-2">Aphasia Description: {patientData.aphasiaDescription}</div>

        <h3 className="text-lg font-semibold mt-4 mb-2">Bedside Exam</h3>
        {/* Repeat similar structure for Bedside Exam data */}
        <div className="mb-2">Smooth Pursuit: {patientData.smoothPursuit}</div>
        <div className="mb-2">Has Nystagmus: {patientData.hasNystagmus}</div>

        <h3 className="text-lg font-semibold mt-4 mb-2">Telestroke Exam</h3>
        {/* Repeat similar structure for Telestroke Exam data */}
        <div className="mb-2">Smooth Pursuit: {patientData.teleSmoothPursuit}</div>
        <div className="mb-2">Has Nystagmus: {patientData.teleHasNystagmus}</div>

        <button onClick={closeModal} className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg">Close</button>
      </div>
    </div>
  );
};

export default PatientReportModal;
