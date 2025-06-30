import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import client from "../api/client";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const EMRReportpage = () => {
  const [Exam_data, setExamData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const Doctor = localStorage.getItem('Doctor');
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
           font-family: 'Helvetica', sans-serif;
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
  const currentRows = filteredExamData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex flex-col lg:flex-row pt-24">
        {/* Sidebar - hidden on mobile (handled by Sidebar component) */}
        <Sidebar page="EMR" />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-[250px] p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                EMR Reports
              </h1>
              
              {/* Search Bar */}
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by Patient ID or Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Patient ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.length > 0 ? (
                      currentRows.map((exam) => (
                        <tr key={`${exam.patientData.patientid}-${exam.patientData.Name}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {exam.patientData.patientid}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {exam.patientData.Name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleShowReport(exam.patientData.patientid)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1" />
                                View
                              </Button>
                              <Button
                                onClick={() => generatePDF(exam, exam.patientData.patientid)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                              >
                                <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                          No reports found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredExamData.length > rowsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex-1 flex justify-between items-center sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * rowsPerPage, filteredExamData.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredExamData.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EMRReportpage;
