import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import client from "../api/client";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const EMRReportpage = () => {
  const [Exam_data, setExamData] = useState([]);
  

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // Get the doctor's information from local storage
        const Doctor = localStorage.getItem('Doctor');
  
        // If doctor is available in local storage, include it in the request
        if (Doctor) {
          const response = await client.get('/api/examdatas', {
            params: { Doctor }
          });
          setExamData(response.data);
        } else {
          console.error("Doctor not found in local storage");
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
      }
    };
  
    fetchExamData();
  }, []);
  

  const generatePDF = (patientData, patientId) => {
    const doc = new jsPDF();
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;

    let yPosition = 15; // Start with a Y position for the title

    // Add the title with Patient ID at the top
    doc.setFontSize(20);
    doc.text(`Report for Patient ID: ${patientId}`, 105, yPosition, null, null, "center");
    yPosition += 10; // Move down slightly to make space for Doctor's name

    // Add Doctor's name at the top along with Patient ID
    doc.text(`Doctor: ${patientData.patientData.Doctor}`, 105, yPosition, null, null, "center");
    yPosition += 20; // Move down after adding Doctor's name

    // Add patient information section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold"); // Set font to bold for the heading
    doc.text("Patient Info:", margin, yPosition);
    doc.setFont("helvetica", "normal"); // Reset font to normal for the content
    yPosition += 10;
    doc.text(`Date of Birth: ${new Date(patientData.patientData.patientDOB).toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Sex: ${patientData.patientData.patientSex}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Exam Date: ${new Date(patientData.patientData.examDate).toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Visual Activity OD: ${patientData.patientData.visualActivityOD}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Visual Activity OS: ${patientData.patientData.visualActivityOS}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Neurological Findings: ${patientData.patientData.neuroFindings}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Aphasia: ${patientData.patientData.hasAphasia}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Aphasia Description: ${patientData.patientData.aphasiaDescription}`, margin, yPosition);
    yPosition += 20;

    // Check if we need to add a page break
    if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15; // Reset Y position after adding a new page
    }

    // Add bedside exam information section
    doc.setFont("helvetica", "bold"); // Set font to bold for the heading
    doc.text("Bedside Exam:", margin, yPosition);
    doc.setFont("helvetica", "normal"); // Reset font to normal for the content
    yPosition += 10;
    doc.text(`Smooth Pursuit: ${patientData.bedsideExamData.smoothPursuitAndSaccadesResult}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Smooth Pursuit Description: ${patientData.bedsideExamData.smoothPursuitAndSaccadesDescription}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Has Nystagmus: ${patientData.bedsideExamData.hasNystagmus}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Gaze Type: ${patientData.bedsideExamData.gazeType}`, margin, yPosition);
    yPosition += 10;

    // Visual Activity OD Section
    doc.text("Visual Activity OD", margin, yPosition);
    yPosition += 10;
    doc.text(`ODRUQ: ${patientData.bedsideExamData.visualFieldsODRUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`ODRLQ: ${patientData.bedsideExamData.visualFieldsODRLQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`ODLUQ: ${patientData.bedsideExamData.visualFieldsODLUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`ODLLQ: ${patientData.bedsideExamData.visualFieldsODLLQ}`, margin, yPosition);
    yPosition += 10;

    // Visual Activity OS Section
    doc.text("Visual Activity OS", margin, yPosition);
    yPosition += 10;
    doc.text(`OSRUQ: ${patientData.bedsideExamData.visualFieldsOSRUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`OSRLQ: ${patientData.bedsideExamData.visualFieldsOSRLQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`OSLUQ: ${patientData.bedsideExamData.visualFieldsOSLUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`OSLLQ: ${patientData.bedsideExamData.visualFieldsOSLLQ}`, margin, yPosition);
    yPosition += 20; // Added space for OS data

    // Check for page break
    if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15;
    }

    // Add telestroke exam information section
    doc.setFont("helvetica", "bold"); // Set font to bold for the heading
    doc.text("Telestroke Exam:", margin, yPosition);
    doc.setFont("helvetica", "normal"); // Reset font to normal for the content
    yPosition += 10;
    doc.text(`Smooth Pursuit: ${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesResult}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Smooth Pursuit Description: ${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesDescription}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Has Nystagmus: ${patientData.teleStrokeExamData.tele_hasNystagmus}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Gaze Type: ${patientData.teleStrokeExamData.tele_gazeType}`, margin, yPosition);
    yPosition += 10;

    // Visual Activity OD Section
    doc.text("Visual Activity OD", margin, yPosition);
    yPosition += 10;
    doc.text(`ODRUQ: ${patientData.teleStrokeExamData.tele_visualFieldsODRUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`ODRLQ: ${patientData.teleStrokeExamData.tele_visualFieldsODRLQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`ODLUQ: ${patientData.teleStrokeExamData.tele_visualFieldsODLUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`ODLLQ: ${patientData.teleStrokeExamData.tele_visualFieldsODLLQ}`, margin, yPosition);
    yPosition += 10;

    // Visual Activity OS Section
    doc.text("Visual Activity OS", margin, yPosition);
    yPosition += 10;
    doc.text(`OSRUQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSRUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`OSRLQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSRLQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`OSLUQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSLUQ}`, margin, yPosition);
    yPosition += 10;
    doc.text(`OSLLQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSLLQ}`, margin, yPosition);
    yPosition += 20; // Added space for OS data

    // Check for page break
    if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15;
    }

    // Save the PDF
    doc.save(`Patient_${patientId}_Report.pdf`);
};


const handleShowReport = (patientId) => {
  const patientData = Exam_data.find((exam) => exam.patientData.patientid === patientId);

  if (patientData) {
    const reportWindow = window.open("", "_blank");
    reportWindow.document.write(`
      <html>
        <head>
          <title>Patient Report - ${patientId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.8;
            }
            h1 {
              text-align: center;
              font-size: 24px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-header {
              font-weight: bold; /* Make the section headings bold */
              font-size: 20px; /* Optional: Increase font size for better visibility */
              margin-bottom: 10px; /* Space between the section header and content */
            }
            .field-title {
              font-weight: normal; /* Ensure field labels are not bold */
            }
            .field {
              margin-bottom: 10px; /* Optional: Space between fields */
            }
            .field-title {
              font-weight: normal; /* Ensure field title is not bold */
            }
            button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              font-size: 16px;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }
            button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Report for Patient ID: ${patientId}</h1>
            <span><strong>Doctor:</strong> ${patientData.patientData.Doctor}</span>
          </div>

          <div class="section">
            <div class="section-header">Patient Info</div>
            <div class="field"><span class="field-title">Date of Birth:</span> <span class="field-value">${new Date(patientData.patientData.patientDOB).toLocaleDateString()}</span></div>
            <div class="field"><span class="field-title">Sex:</span> <span class="field-value">${patientData.patientData.patientSex}</span></div>
            <div class="field"><span class="field-title">Exam Date:</span> <span class="field-value">${new Date(patientData.patientData.examDate).toLocaleDateString()}</span></div>
            <div class="field"><span class="field-title">Visual Activity OD:</span> <span class="field-value">${patientData.patientData.visualActivityOD}</span></div>
            <div class="field"><span class="field-title">Visual Activity OS:</span> <span class="field-value">${patientData.patientData.visualActivityOS}</span></div>
            <div class="field"><span class="field-title">Neurological Findings:</span> <span class="field-value">${patientData.patientData.neuroFindings}</span></div>
            <div class="field"><span class="field-title">Aphasia:</span> <span class="field-value">${patientData.patientData.hasAphasia}</span></div>
            <div class="field"><span class="field-title">Aphasia Description:</span> <span class="field-value">${patientData.patientData.aphasiaDescription}</span></div>
          </div>

          <div class="section">
            <div class="section-header">Bedside Exam</div>
            <div class="field"><span class="field-title">Smooth Pursuit:</span> <span class="field-value">${patientData.bedsideExamData.smoothPursuitAndSaccadesResult}</span></div>
            <div class="field"><span class="field-title">Smooth Pursuit Description:</span> <span class="field-value">${patientData.bedsideExamData.smoothPursuitAndSaccadesDescription}</span></div>
            <div class="field"><span class="field-title">Has Nystagmus:</span> <span class="field-value">${patientData.bedsideExamData.hasNystagmus}</span></div>
            <div class="field"><span class="field-title">Gaze Type:</span> <span class="field-value">${patientData.bedsideExamData.gazeType}</span></div>
            <div class="field"><span class="field-title">Visual Field OD:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">ODRUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODRUQ}</span></div>
            <div class="field"><span class="field-title">ODRLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODRLQ}</span></div>
            <div class="field"><span class="field-title">ODLUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODLUQ}</span></div>
            <div class="field"><span class="field-title">ODLLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODLLQ}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement:</span> <span class="field-value">${patientData.bedsideExamData.extraocularMovementResult}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement Description:</span> <span class="field-value">${patientData.bedsideExamData.extraocularMovementDescription}</span></div>
            <div class="field"><span class="field-title">Nystagmus Degree:</span> <span class="field-value">${patientData.bedsideExamData.nystagmusDegree}</span></div>
            <div class="field"><span class="field-title">Exam Tolerated:</span> <span class="field-value">${patientData.bedsideExamData.examTolerated}</span></div>
            <div class="field"><span class="field-title">Visual Field OS:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">OSRUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSRUQ}</span></div>
            <div class="field"><span class="field-title">OSRLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSRLQ}</span></div>
            <div class="field"><span class="field-title">OSLUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSLUQ}</span></div>
            <div class="field"><span class="field-title">OSLLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSLLQ}</span></div>
          </div>

          <div class="section">
            <div class="section-header">Telestroke Exam</div>
            <div class="field"><span class="field-title">Smooth Pursuit:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesResult}</span></div>
            <div class="field"><span class="field-title">Smooth Pursuit Description:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesDescription}</span></div>
            <div class="field"><span class="field-title">Has Nystagmus:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_hasNystagmus}</span></div>
            <div class="field"><span class="field-title">Gaze Type:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_gazeType}</span></div>
            <div class="field"><span class="field-title">Visual Field OD:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">ODRUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODRUQ}</span></div>
            <div class="field"><span class="field-title">ODRLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODRLQ}</span></div>
            <div class="field"><span class="field-title">ODLUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODLUQ}</span></div>
            <div class="field"><span class="field-title">ODLLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODLLQ}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_extraocularMovementResult}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement Description:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_extraocularMovementDescription}</span></div>
            <div class="field"><span class="field-title">Nystagmus Degree:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_nystagmusDegree}</span></div>
            <div class="field"><span class="field-title">Exam Tolerated:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_examTolerated}</span></div>
            <div class="field"><span class="field-title">Visual Field OS:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">OSRUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSRUQ}</span></div>
            <div class="field"><span class="field-title">OSRLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSRLQ}</span></div>
            <div class="field"><span class="field-title">OSLUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSLUQ}</span></div>
            <div class="field"><span class="field-title">OSLLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSLLQ}</span></div>
          </div>

          <button onclick="window.print()">Print Report</button>
        </body>
      </html>
    `);
  }
};


  return (
    <>
      <NavBar />
      <div className="flex flex-row justify-between gap-2 mb-28 bg-slate-50">
        <div className="basis-[5%]">
          <Sidebar page="EMR" />
        </div>
        <div className="basis-[80%] flex flex-col gap-5 h-2/6">
          <div className="mt-6 px-4">
            <div className="overflow-x-auto" style={{ marginRight: '15%' }}>
              <table className="table-auto border-collapse border border-gray-300 w-full">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="border px-4 py-2 text-left">Patient ID</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Exam_data.map((exam) => (
                    <tr key={exam.patientData.patientid} className="hover:bg-gray-50">
                      <td className="bg-white border px-4 py-2 text-left">
                        {exam.patientData.patientid}
                      </td>
                      <td className="bg-white border px-4 py-2 text-left">
  <Button
    className=""
    onClick={() => handleShowReport(exam.patientData.patientid)}
  >
    VIEW
  </Button>
 <Button
  className=""
  onClick={() => generatePDF(exam, exam.patientData.patientid)}
>
  <FontAwesomeIcon icon={faDownload} className="text-white" />
</Button>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EMRReportpage;
