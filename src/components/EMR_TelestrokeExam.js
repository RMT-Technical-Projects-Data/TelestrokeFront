import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EMR_TelestrokeExam() {
  const [formData1, setFormData1] = useState({
    smoothPursuitAndSaccadesResult: "", // Smooth Pursuit and Saccades
    hasNystagmus: "", // Has Nystagmus (boolean)
    gazeType: "", // Gaze Type
    smoothPursuitAndSaccadesDescription: "",
    extraocularMovementDescription: "",
    od: { ruq: null, rlq: null, luq: null, llq: null }, // Visual Fields OD
    extraocularMovementResult: "", // Extraocular Movement
    nystagmusDegree: "", // Nystagmus Degree
    examTolerated: "", // Exam Tolerated (boolean)
    os: { ruq: null, rlq: null, luq: null, llq: null }, // Visual Fields OS
  });



  const [, setSavedData] = useState(null);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    if (type === "radio") {
      if (name.startsWith("od-") || name.startsWith("os-")) {
        const [field, region] = name.split("-");
        setFormData1((prevState) => ({
          ...prevState,
          [field]: {
            ...prevState[field],
            [region]: checked ? value : null,
          },
        }));
      } else if (name === "hasNystagmus" || name === "examTolerated") {
        setFormData1((prevState) => ({
          ...prevState,
          [name]: checked ? value === "true" : false,
        }));
      } else {
        setFormData1((prevState) => ({
          ...prevState,
          [name]: checked ? value : "",
        }));
      }
    } else {
      setFormData1((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };



  const handleSet = () => {
    // Validation check for empty fields
    for (const key in formData1) {
      if (formData1[key] === "") {
        toast.error(`Please fill in all fields. Missing field: ${key}`);
        return;
      }
    }
    setSavedData(formData1);
    localStorage.setItem("emrTelestrokeExam", JSON.stringify(formData1)); // Save to local storage
    toast.success("EMR_Telestroke information Set.");
    // console.log("EMR_BedSide Info:", formData);
  };


  return (
    <div className="scrollable-container overflow-x-auto h-[250px]">
    <div className="flex flex-col gap-4 ml-3">
      <div className="flex flex-row gap-8 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">Smooth Pursuit and Saccades</p>
          <input
            className="inline m-2"
            name="smoothPursuitAndSaccadesResult"
            type="radio"
            value="Normal"
            checked={formData1.smoothPursuitAndSaccadesResult === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="smoothPursuitAndSaccadesResult"
            type="radio"
            value="Abnormal"
            checked={formData1.smoothPursuitAndSaccadesResult === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="smoothPursuitAndSaccadesDescription"
            value={formData1.smoothPursuitAndSaccadesDescription}
            maxLength={50} // Limit text to 40 characters
            onChange={handleChange}
          />
        </div>
        <div className="basis-1/4">
          <p className="font-bold">Has Nystagmus</p>
          <div>
            <input
              className="m-2"
              name="hasNystagmus"
              type="radio"
              value="true"
              checked={formData1.hasNystagmus === true}
              onChange={handleChange}
            />
            <label>Yes</label>
          </div>
          <div>
            <input
              className="m-2"
              name="hasNystagmus"
              type="radio"
              value="false"
              checked={formData1.hasNystagmus === false}
              onChange={handleChange}
            />
            <label>No</label>
          </div>
        </div>
        <div className="basis-1/4">
          <p className="font-bold">Gaze Type</p>
          <div>
            <input
              className="m-2"
              name="gazeType"
              type="radio"
              value="Conjugate"
              checked={formData1.gazeType === "Conjugate"}
              onChange={handleChange}
            />
            <label>Conjugate</label>
          </div>
          <div>
            <input
              className="m-2"
              name="gazeType"
              type="radio"
              value="Dysconjugate"
              checked={formData1.gazeType === "Dysconjugate"}
              onChange={handleChange}
            />
            <label>Dysconjugate</label>
          </div>
        </div>
        <div className="basis-2/4">
          <p className="text-center font-bold">Visual Fields: OD</p>
          <div>
            <div className="mt-2">
              <div className="flex items-center">
                <span className="w-16" style={{ fontWeight: 'bold' }}>RUQ:</span>
                <input
                  type="radio"
                  name="od-ruq"
                  value="pass"
                  checked={formData1.od.ruq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-ruq"
                  value="fail"
                  checked={formData1.od.ruq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24"style={{ fontWeight: 'bold' }}>RLQ:</span>
                <input
                  type="radio"
                  name="od-rlq"
                  value="pass"
                  checked={formData1.od.rlq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-rlq"
                  value="fail"
                  checked={formData1.od.rlq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
              </div>
              <div className="flex items-center mt-2">
                <span className="w-16"style={{ fontWeight: 'bold' }}>LUQ:</span>
                <input
                  type="radio"
                  name="od-luq"
                  value="pass"
                  checked={formData1.od.luq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-luq"
                  value="fail"
                  checked={formData1.od.luq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24"style={{ fontWeight: 'bold' }}>LLQ:</span>
                <input
                  type="radio"
                  name="od-llq"
                  value="pass"
                  checked={formData1.od.llq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-llq"
                  value="fail"
                  checked={formData1.od.llq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-8 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">Extraocular Movement</p>
          <input
            className="inline m-2"
            name="extraocularMovementResult"
            type="radio"
            value="Normal"
            checked={formData1.extraocularMovementResult === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="extraocularMovementResult"
            type="radio"
            value="Abnormal"
            checked={formData1.extraocularMovementResult === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="extraocularMovementDescription"
            value={formData1.extraocularMovementDescription}
            maxLength={50} // Limit text to 40 characters
            onChange={handleChange}
          />
        </div>
        <div className="basis-1/4">
        <span className="w-16"style={{ fontWeight: 'bold' }}>Nystagmus Degree</span>
          <div>
            <input
              className="m-2"
              name="nystagmusDegree"
              type="radio"
              value="First"
              checked={formData1.nystagmusDegree === "First"}
              onChange={handleChange}
            />
            <label>First</label>
          </div>
          <div>
            <input
              className="m-2"
              name="nystagmusDegree"
              type="radio"
              value="Second"
              checked={formData1.nystagmusDegree === "Second"}
              onChange={handleChange}
            />
            <label>Second</label>
          </div>
          <div>
            <input
              className="m-2"
              name="nystagmusDegree"
              type="radio"
              value="Third"
              checked={formData1.nystagmusDegree === "Third"}
              onChange={handleChange}
            />
            <label>Third</label>
          </div>
        </div>
        <div className="basis-1/4">
        <span className="w-16"style={{ fontWeight: 'bold' }}>Exam Tolerated</span>
          <div>
            <input
              className="m-2"
              name="examTolerated"
              type="radio"
              value="true"
              checked={formData1.examTolerated === true}
              onChange={handleChange}
            />
            <label>Yes</label>
          </div>
          <div>
            <input
              className="m-2"
              name="examTolerated"
              type="radio"
              value="false"
              checked={formData1.examTolerated === false}
              onChange={handleChange}
            />
            <label>No</label>
          </div>
        </div>
        <div className="basis-2/4">
          <p className="text-center font-bold">Visual Fields: OS</p>
          <div>
            <div className="mt-2">
              <div className="flex items-center">
                <span className="w-16"style={{ fontWeight: 'bold' }}>RUQ:</span>
                <input
                  type="radio"
                  name="os-ruq"
                  value="pass"
                  checked={formData1.os.ruq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-ruq"
                  value="fail"
                  checked={formData1.os.ruq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24"style={{ fontWeight: 'bold' }}>RLQ:</span>
                <input
                  type="radio"
                  name="os-rlq"
                  value="pass"
                  checked={formData1.os.rlq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-rlq"
                  value="fail"
                  checked={formData1.os.rlq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
              </div>
              <div className="flex items-center mt-2">
                <span className="w-16"style={{ fontWeight: 'bold' }}>LUQ:</span>
                <input
                  type="radio"
                  name="os-luq"
                  value="pass"
                  checked={formData1.os.luq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-luq"
                  value="fail"
                  checked={formData1.os.luq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24"style={{ fontWeight: 'bold' }}>LLQ:</span>
                <input
                  type="radio"
                  name="os-llq"
                  value="pass"
                  checked={formData1.os.llq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-llq"
                  value="fail"
                  checked={formData1.os.llq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md w-28 text-sm  transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={handleSet}>
        Set
      </button>
      </div>
      
      <ToastContainer />
    </div>
  );
}

export default EMR_TelestrokeExam;


