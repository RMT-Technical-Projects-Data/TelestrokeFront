import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import client from "../api/client"; // Import your axios client
import { useParams } from "react-router-dom";
import jsPDF from "jspdf"; // Import jsPDF for PDF generation

const EMRReportpage = () => {
  const [Exam_data, setExamData] = useState([]); // State to hold patient data
  const { patientid, meetingid } = useParams();

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await client.get('/api/examdatas'); 
        setExamData(response.data); 
      } catch (error) {
        console.error("Error fetching patients data:", error);
      }
    };

    fetchExamData(); // Fetch data on mount
  }, []); // Empty dependency array to run once on component mount

  // Function to handle showing the full report
  const handleShowReport = (patientId) => {
    // Open the full report in a new tab (using a temporary URL)
    const reportWindow = window.open("", "_blank");
    reportWindow.document.write(`
      <html>
        <head>
          <title>Patient Report - ${patientId}</title>
        </head>
        <body>
          <h1>Full Report for Patient ID: ${patientId}</h1>
          <div id="reportContent"></div>
          <button onclick="downloadPDF()">Download PDF</button>
          <script>
            function downloadPDF() {
              const doc = new jsPDF();
              const content = document.getElementById('reportContent').innerText;
              doc.text(content, 10, 10);
              doc.save('patient_report_${patientId}.pdf');
            }
          </script>
        </body>
      </html>
    `);
  
    // Fetch and display patient-specific data
    const patientData = Exam_data.find(exam => exam.patientData.patientid === patientId);
    if (patientData) {
      const reportContent = `
        <h3>Patient Details:</h3>
        <p>Date of Birth: ${new Date(patientData.patientData.patientDOB).toLocaleDateString()}</p>
        <p>Sex: ${patientData.patientData.patientSex}</p>
        <p>Exam Date: ${new Date(patientData.patientData.examDate).toLocaleDateString()}</p>
        <p>Visual Activity OD: ${patientData.patientData.visualActivityOD}</p>
        <p>Visual Activity OS: ${patientData.patientData.visualActivityOS}</p>
        <p>Neurological Findings: ${patientData.patientData.neuroFindings}</p>
        <p>Aphasia: ${patientData.patientData.hasAphasia}</p>
        <p>Aphasia Description: ${patientData.patientData.aphasiaDescription}</p>
        
        <h3>Bedside Exam:</h3>
        <p>Smooth Pursuit: ${patientData.bedsideExamData.smoothPursuitAndSaccadesResult}</p>
        <p>Smooth Pursuit Description: ${patientData.bedsideExamData.smoothPursuitAndSaccadesDescription}</p>
        <p>Has Nystagmus: ${patientData.bedsideExamData.hasNystagmus}</p>
        <p>Gaze Type: ${patientData.bedsideExamData.gazeType}</p>
        <p>Visual Fields ODRUQ: ${patientData.bedsideExamData.visualFieldsODRUQ}</p>
        <p>Visual Fields ODRLQ: ${patientData.bedsideExamData.visualFieldsODRLQ}</p>
        <p>Visual Fields ODLUQ: ${patientData.bedsideExamData.visualFieldsODLUQ}</p>
        <p>Visual Fields ODLLQ: ${patientData.bedsideExamData.visualFieldsODLLQ}</p>
        <p>Extraocular Movement: ${patientData.bedsideExamData.extraocularMovementResult}</p>
        <p>Extraocular Movement Description: ${patientData.bedsideExamData.extraocularMovementDescription}</p>
        <p>Nystagmus Degree: ${patientData.bedsideExamData.nystagmusDegree}</p>
        <p>Exam Tolerated: ${patientData.bedsideExamData.examTolerated}</p>
        <p>Visual Fields OSRUQ: ${patientData.bedsideExamData.visualFieldsOSRUQ}</p>
        <p>Visual Fields OSRLQ: ${patientData.bedsideExamData.visualFieldsOSRLQ}</p>
        <p>Visual Fields OSLUQ: ${patientData.bedsideExamData.visualFieldsOSLUQ}</p>
        <p>Visual Fields OSLLQ: ${patientData.bedsideExamData.visualFieldsOSLLQ}</p>
        
        <h3>Telestroke Exam:</h3>
        <p>Smooth Pursuit: ${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesResult}</p>
        <p>Smooth Pursuit Description: ${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesDescription}</p>
        <p>Has Nystagmus: ${patientData.teleStrokeExamData.tele_hasNystagmus}</p>
        <p>Gaze Type: ${patientData.teleStrokeExamData.tele_gazeType}</p>
        <p>Visual Fields ODRUQ: ${patientData.teleStrokeExamData.tele_visualFieldsODRUQ}</p>
        <p>Visual Fields ODRLQ: ${patientData.teleStrokeExamData.tele_visualFieldsODRLQ}</p>
        <p>Visual Fields ODLUQ: ${patientData.teleStrokeExamData.tele_visualFieldsODLUQ}</p>
        <p>Visual Fields ODLLQ: ${patientData.teleStrokeExamData.tele_visualFieldsODLLQ}</p>
        <p>Extraocular Movement: ${patientData.teleStrokeExamData.tele_extraocularMovementResult}</p>
        <p>Extraocular Movement Description: ${patientData.teleStrokeExamData.tele_extraocularMovementDescription}</p>
        <p>Nystagmus Degree: ${patientData.teleStrokeExamData.tele_nystagmusDegree}</p>
        <p>Exam Tolerated: ${patientData.teleStrokeExamData.tele_examTolerated}</p>
        <p>Visual Fields OSRUQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSRUQ}</p>
        <p>Visual Fields OSRLQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSRLQ}</p>
        <p>Visual Fields OSLUQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSLUQ}</p>
        <p>Visual Fields OSLLQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSLLQ}</p>
      `;
      
      reportWindow.document.getElementById('reportContent').innerHTML = reportContent;
    }
  };
  

  return (
    <>
      <NavBar />
      <div className="flex flex-row justify-between gap-2 mb-28 bg-slate-50">
        <div className="basis-[5%]">
          <Sidebar page="EMR" />
        </div>
        {!patientid ? (
          // Patient ID is not present in the address
          <div className="basis-[80%] flex flex-col gap-5 h-2/6">
            <div className="flex flex-row gap-5">
              <input
                type="text"
                className="shadow-sm rounded-lg w-2/3 mx-auto h-2/4 p-1 pl-4 mt-6"
                placeholder="Search for a patient"
              />
              <Button onClick={() => {}} className="mx-auto h-2/4 mt-4">
                Search
              </Button>
            </div>
            {/* Display the table below the search bar */}
            <div className="mt-6 px-4">
              <div className="overflow-x-auto" style={{ marginRight: '15%' }}>
                <table className="table-auto border-collapse border border-gray-300 w-full">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-4 py-2 text-left">Patient ID</th>
                    
                      <th className="border px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Exam_data.map((exam) => (
                      <tr key={exam.patientData.patientid} className="hover:bg-gray-50">
                        {/* Patient ID */}
                        <td className="border px-4 py-2 text-left">
                          {exam.patientData.patientid}
                        </td>
                       
                      
                        {/* Actions */}
                        <td className="border px-4 py-2 text-left">
                          <Button onClick={() => handleShowReport(exam.patientData.patientid)}>SHOW</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Placeholder for when patientId is available
          <div className="basis-[80%]"> {/* Add the details for patient view here */} </div>
        )}
      </div>
    </>
  );
};

export default EMRReportpage;
