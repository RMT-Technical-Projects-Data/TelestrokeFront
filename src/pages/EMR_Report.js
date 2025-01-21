import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import client from "../api/client";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload } from '@fortawesome/free-solid-svg-icons';

const EMRReportpage = () => {
  const [Exam_data, setExamData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  
   
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

    // Add Patient Name
    doc.text(`Name: ${patientData.patientData.Name}`, margin, yPosition);
    yPosition += 10;

    // Add other patient details
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
                <style>
          body {
           font-family: 'Roboto', Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            background-color: #f9f9fb;
            color: #333;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            align-content: center;
            flex-wrap: wrap;
            
          }
          h1 {
            text-align: center;
            font-size: 28px;
            margin-bottom: 20px;
            color: #4f46e5; /* Soft blue for emphasis */
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 2px solid #d1d5db; /* Subtle border for separation */
          }
          .section {
            margin-bottom: 40px;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add a subtle shadow */
            width:80% !important;
          }
          .section-header {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af; /* Darker blue for section headers */
            margin-bottom: 15px;
            border-left: 5px solid #4f46e5; /* Decorative left border */
            padding-left: 10px;
          }
          .field {
            margin-bottom: 12px;
            font-size: 16px;
            align-items: center; /* Align titles and values */
            padding: 8px;
            border-radius: 5px; /* Rounded edges */
          }
          
          .field-title {
            font-weight: bold;
            color: #4b5563;
            padding-left: 10px;
          }
          .field-value {
            color: #111827; /* Darker tone for emphasis */
          }
          button {
            display: block;
            margin: 30px auto;
            padding: 12px 24px;
            font-size: 16px;
            background-color: #4f46e5; /* Consistent blue for action */
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.3s; /* Smooth animation */
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Add button shadow */
          }
          button:hover {
            background-color: #3730a3; /* Slightly darker blue */
            transform: scale(1.05); /* Subtle scaling effect on hover */
          }
          button:active {
            transform: scale(0.95); /* Press effect */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Reduce shadow on press */
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
            <div class="field"><span class="field-title">Name:</span> <span class="field-value">${patientData.patientData.Name}</span></div>
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



  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value); 
    setCurrentPage(1); 
  };

  const filteredExamData = useMemo(() => {
    return Exam_data.filter((exam) =>
      exam.patientData.patientid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.patientData.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [Exam_data, searchQuery]);


  const totalPages = Math.ceil(filteredExamData.length / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredExamData.slice(startRow, startRow + rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  

  return (
    <>
      <NavBar />
      <div className="flex flex-col lg:flex-row gap-4 mb-32 mt-[8%] px-4 lg:px-0">
        {/* Sidebar */}
        <div className="lg:w-[15%] w-full flex-shrink-0 bg-gray-100 lg:min-h-screen">
          <Sidebar page="EMR" />
        </div>
        
        {/* Main Content */}
        <div className="flex-grow w-full lg:ml-7 flex flex-col items-center">
        <div className="w-full max-w-5xl mt-4 px-4 sm:mt-6 sm:px-6 lg:mt-[2%] lg:px-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 text-center lg:text-left">
              EMR Reports
            </h1>
            
            {/* Search Bar */}
            <div className="mb-6 flex justify-center lg:justify-start">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by Patient ID or Name"
                className="p-3 w-full sm:w-1/3 lg:w-1/2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
                    
                {/* Table */}
<div className="overflow-x-auto">
  <table className="table-auto bg-white border border-gray-200 sm:w-full w-auto shadow-lg rounded-lg sm:text-sm">
    <thead className="bg-indigo-50">
      <tr>
        <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 font-medium text-xs sm:text-sm">
          Patient ID
        </th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 font-medium text-xs sm:text-sm">
          Patient Name
        </th>
        <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-700 font-medium text-xs sm:text-sm">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      {currentRows.map((exam) => (
        <tr
          key={`${exam.patientData.patientid}-${exam.patientData.Name}`}
          className="border-t border-gray-300 hover:bg-indigo-50 transition duration-150"
        >
          <td className="px-4 sm:px-6 py-2 sm:py-4 text-center text-xs sm:text-sm">
            {exam.patientData.patientid}
          </td>
          <td className="px-4 sm:px-6 py-2 sm:py-4 text-center text-xs sm:text-sm">
            {exam.patientData.Name}
          </td>
          <td className="px-4 sm:px-6 py-2 sm:py-4 text-center text-xs sm:text-sm">
            <Button
              onClick={() => handleShowReport(exam.patientData.patientid)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mr-2 text-xs sm:text-sm"
            >
              <FontAwesomeIcon icon={faEye} />
            </Button>
            <Button
              onClick={() => generatePDF(exam, exam.patientData.patientid)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-xs sm:text-sm"
            >
              <FontAwesomeIcon icon={faDownload} />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


            
            {/* Pagination */}
            <div className="flex justify-center mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`px-4 py-2 rounded-md mr-2 ${
                  currentPage === 1
                    ? 'bg-gray-400 text-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Prev
              </button>
              <span className="text-gray-700 px-4 py-2">
                {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`px-4 py-2 rounded-md ml-2 ${
                  currentPage === totalPages
                    ? 'bg-gray-400 text-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  
  };    
export default EMRReportpage;
