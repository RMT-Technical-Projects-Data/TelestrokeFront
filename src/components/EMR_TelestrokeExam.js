import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EMR_TelestrokeExam() {
  const [formData1, setFormData1] = useState(() => {
    const saved = localStorage.getItem("emrTelestrokeExam");
    return saved ? JSON.parse(saved) : {
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
    };
  });

  // Auto-save to localStorage whenever formData1 changes
  React.useEffect(() => {
    localStorage.setItem("emrTelestrokeExam", JSON.stringify(formData1));
  }, [formData1]);

  const handleChange = (e) => {
    let { name, type, value, checked } = e.target;

    // Strip prefix for state mapping if it exists
    const stateName = name.startsWith("tele-") ? name.replace("tele-", "") : name;

    if (type === "radio") {
      if (stateName.startsWith("od") || stateName.startsWith("os")) {
        // Handle nested state for od/os
        const [field, region] = stateName.split("-");
        setFormData1((prevState) => ({
          ...prevState,
          [field]: {
            ...prevState[field],
            [region]: checked ? value : null,
          },
        }));
      } else if (stateName === "hasNystagmus" || stateName === "examTolerated") {
        setFormData1((prevState) => ({
          ...prevState,
          [stateName]: checked ? value === "true" : false,
        }));
      } else {
        setFormData1((prevState) => ({
          ...prevState,
          [stateName]: checked ? value : "",
        }));
      }
    } else {
      setFormData1((prevState) => ({
        ...prevState,
        [stateName]: value,
      }));
    }
  };

  return (
    <div className="p-2">
      <div className="flex flex-col gap-4 ml-3">
        <div className="flex flex-row gap-8 justify-between">
          <div className="basis-2/4">
            <div className="flex items-center gap-4 mb-2">
              <p className="font-bold text-lg">Smooth Pursuit and Saccades</p>
              <div className="flex items-center gap-1">
                <input
                  className="w-4 h-4 cursor-pointer"
                  name="tele-smoothPursuitAndSaccadesResult"
                  type="radio"
                  value="Normal"
                  checked={formData1.smoothPursuitAndSaccadesResult === "Normal"}
                  onChange={handleChange}
                />
                <label className="cursor-pointer">Normal</label>
              </div>
              <div className="flex items-center gap-1">
                <input
                  className="w-4 h-4 cursor-pointer"
                  name="tele-smoothPursuitAndSaccadesResult"
                  type="radio"
                  value="Abnormal"
                  checked={formData1.smoothPursuitAndSaccadesResult === "Abnormal"}
                  onChange={handleChange}
                />
                <label className="cursor-pointer">Abnormal</label>
              </div>
            </div>
            <textarea
              className="h-20 block w-[100%] border border-gray-300 rounded p-2"
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
                name="tele-hasNystagmus"
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
                name="tele-hasNystagmus"
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
                name="tele-gazeType"
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
                name="tele-gazeType"
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
                    name="tele-od-ruq"
                    value="pass"
                    checked={formData1.od.ruq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-od-ruq"
                    value="fail"
                    checked={formData1.od.ruq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>RLQ:</span>
                  <input
                    type="radio"
                    name="tele-od-rlq"
                    value="pass"
                    checked={formData1.od.rlq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-od-rlq"
                    value="fail"
                    checked={formData1.od.rlq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                </div>
                <div className="flex items-center mt-2">
                  <span className="w-16" style={{ fontWeight: 'bold' }}>LUQ:</span>
                  <input
                    type="radio"
                    name="tele-od-luq"
                    value="pass"
                    checked={formData1.od.luq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-od-luq"
                    value="fail"
                    checked={formData1.od.luq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>LLQ:</span>
                  <input
                    type="radio"
                    name="tele-od-llq"
                    value="pass"
                    checked={formData1.od.llq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-od-llq"
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
            <div className="flex items-center gap-4 mb-2">
              <p className="font-bold text-lg">Extraocular Movement</p>
              <div className="flex items-center gap-1">
                <input
                  className="w-4 h-4 cursor-pointer"
                  name="tele-extraocularMovementResult"
                  type="radio"
                  value="Normal"
                  checked={formData1.extraocularMovementResult === "Normal"}
                  onChange={handleChange}
                />
                <label className="cursor-pointer">Normal</label>
              </div>
              <div className="flex items-center gap-1">
                <input
                  className="w-4 h-4 cursor-pointer"
                  name="tele-extraocularMovementResult"
                  type="radio"
                  value="Abnormal"
                  checked={formData1.extraocularMovementResult === "Abnormal"}
                  onChange={handleChange}
                />
                <label className="cursor-pointer">Abnormal</label>
              </div>
            </div>
            <textarea
              className="h-20 block w-[100%] border border-gray-300 rounded p-2"
              name="extraocularMovementDescription"
              value={formData1.extraocularMovementDescription}
              maxLength={50} // Limit text to 40 characters
              onChange={handleChange}
            />
          </div>
          <div className="basis-1/4">
            <span className="w-16" style={{ fontWeight: 'bold' }}>Nystagmus Degree</span>
            <div>
              <input
                className="m-2"
                name="tele-nystagmusDegree"
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
                name="tele-nystagmusDegree"
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
                name="tele-nystagmusDegree"
                type="radio"
                value="Third"
                checked={formData1.nystagmusDegree === "Third"}
                onChange={handleChange}
              />
              <label>Third</label>
            </div>
          </div>
          <div className="basis-1/4">
            <span className="w-16" style={{ fontWeight: 'bold' }}>Exam Tolerated</span>
            <div>
              <input
                className="m-2"
                name="tele-examTolerated"
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
                name="tele-examTolerated"
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
                  <span className="w-16" style={{ fontWeight: 'bold' }}>RUQ:</span>
                  <input
                    type="radio"
                    name="tele-os-ruq"
                    value="pass"
                    checked={formData1.os.ruq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-os-ruq"
                    value="fail"
                    checked={formData1.os.ruq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>RLQ:</span>
                  <input
                    type="radio"
                    name="tele-os-rlq"
                    value="pass"
                    checked={formData1.os.rlq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-os-rlq"
                    value="fail"
                    checked={formData1.os.rlq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                </div>
                <div className="flex items-center mt-2">
                  <span className="w-16" style={{ fontWeight: 'bold' }}>LUQ:</span>
                  <input
                    type="radio"
                    name="tele-os-luq"
                    value="pass"
                    checked={formData1.os.luq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-os-luq"
                    value="fail"
                    checked={formData1.os.luq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>LLQ:</span>
                  <input
                    type="radio"
                    name="tele-os-llq"
                    value="pass"
                    checked={formData1.os.llq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="tele-os-llq"
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
      </div>
    </div>
  );
}

export default EMR_TelestrokeExam;


