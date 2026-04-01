import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EMR_BedSide() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("emrBedSideData");
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

  const [, setSavedData] = useState(null);

  // Auto-save to localStorage whenever formData changes
  React.useEffect(() => {
    localStorage.setItem("emrBedSideData", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    let { name, type, value, checked } = e.target;

    // Strip prefix for state mapping if it exists
    const stateName = name.startsWith("bedside-") ? name.replace("bedside-", "") : name;

    if (type === "radio") {
      if (stateName.startsWith("od") || stateName.startsWith("os")) {
        // Handle nested state for od/os
        const [field, region] = stateName.split("-");
        setFormData((prevState) => ({
          ...prevState,
          [field]: {
            ...prevState[field],
            [region]: checked ? value : null,
          },
        }));
      } else if (stateName === "hasNystagmus" || stateName === "examTolerated") {
        setFormData((prevState) => ({
          ...prevState,
          [stateName]: checked ? value === "true" : false,
        }));
      } else {
        setFormData((prevState) => ({
          ...prevState,
          [stateName]: checked ? value : "",
        }));
      }
    } else {
      setFormData((prevState) => ({
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
            <p className="font-bold text-lg inline mr-4">Smooth Pursuit and Saccades</p>
            <input
              className="inline m-2"
              name="bedside-smoothPursuitAndSaccadesResult"
              type="radio"
              value="Normal"
              checked={formData.smoothPursuitAndSaccadesResult === "Normal"}
              onChange={handleChange}
            />
            <label>Normal</label>
            <input
              className="inline m-2"
              name="bedside-smoothPursuitAndSaccadesResult"
              type="radio"
              value="Abnormal"
              checked={formData.smoothPursuitAndSaccadesResult === "Abnormal"}
              onChange={handleChange}
            />
            <label>Abnormal</label>
            <textarea
              className="h-20 block w-[100%] border border-gray-300 rounded p-2"
              name="smoothPursuitAndSaccadesDescription"
              value={formData.smoothPursuitAndSaccadesDescription}
              maxLength={50} // Limit text to 40 characters
              onChange={handleChange}
            />
          </div>
          <div className="basis-1/4">
            <p className="font-bold">Has Nystagmus</p>
            <div>
              <input
                className="m-2"
                name="bedside-hasNystagmus"
                type="radio"
                value="true"
                checked={formData.hasNystagmus === true}
                onChange={handleChange}
              />
              <label>Yes</label>
            </div>
            <div>
              <input
                className="m-2"
                name="bedside-hasNystagmus"
                type="radio"
                value="false"
                checked={formData.hasNystagmus === false}
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
                name="bedside-gazeType"
                type="radio"
                value="Conjugate"
                checked={formData.gazeType === "Conjugate"}
                onChange={handleChange}
              />
              <label>Conjugate</label>
            </div>
            <div>
              <input
                className="m-2"
                name="bedside-gazeType"
                type="radio"
                value="Dysconjugate"
                checked={formData.gazeType === "Dysconjugate"}
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
                    name="bedside-od-ruq"
                    value="pass"
                    checked={formData.od.ruq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-od-ruq"
                    value="fail"
                    checked={formData.od.ruq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>RLQ:</span>
                  <input
                    type="radio"
                    name="bedside-od-rlq"
                    value="pass"
                    checked={formData.od.rlq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-od-rlq"
                    value="fail"
                    checked={formData.od.rlq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                </div>
                <div className="flex items-center mt-2">
                  <span className="w-16" style={{ fontWeight: 'bold' }}>LUQ:</span>
                  <input
                    type="radio"
                    name="bedside-od-luq"
                    value="pass"
                    checked={formData.od.luq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-od-luq"
                    value="fail"
                    checked={formData.od.luq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>LLQ:</span>
                  <input
                    type="radio"
                    name="bedside-od-llq"
                    value="pass"
                    checked={formData.od.llq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-od-llq"
                    value="fail"
                    checked={formData.od.llq === "fail"}
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
              name="bedside-extraocularMovementResult"
              type="radio"
              value="Normal"
              checked={formData.extraocularMovementResult === "Normal"}
              onChange={handleChange}
            />
            <label>Normal</label>
            <input
              className="inline m-2"
              name="bedside-extraocularMovementResult"
              type="radio"
              value="Abnormal"
              checked={formData.extraocularMovementResult === "Abnormal"}
              onChange={handleChange}
            />
            <label>Abnormal</label>
            <textarea
              className="h-20 block w-[100%] border border-gray-300 rounded p-2"
              name="extraocularMovementDescription"
              value={formData.extraocularMovementDescription}
              maxLength={50} // Limit text to 40 characters
              onChange={handleChange}
            />
          </div>
          <div className="basis-1/4">
            <span className="w-16" style={{ fontWeight: 'bold' }}>Nystagmus Degree</span>
            <div>
              <input
                className="m-2"
                name="bedside-nystagmusDegree"
                type="radio"
                value="First"
                checked={formData.nystagmusDegree === "First"}
                onChange={handleChange}
              />
              <label>First</label>
            </div>
            <div>
              <input
                className="m-2"
                name="bedside-nystagmusDegree"
                type="radio"
                value="Second"
                checked={formData.nystagmusDegree === "Second"}
                onChange={handleChange}
              />
              <label>Second</label>
            </div>
            <div>
              <input
                className="m-2"
                name="bedside-nystagmusDegree"
                type="radio"
                value="Third"
                checked={formData.nystagmusDegree === "Third"}
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
                name="bedside-examTolerated"
                type="radio"
                value="true"
                checked={formData.examTolerated === true}
                onChange={handleChange}
              />
              <label>Yes</label>
            </div>
            <div>
              <input
                className="m-2"
                name="bedside-examTolerated"
                type="radio"
                value="false"
                checked={formData.examTolerated === false}
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
                    name="bedside-os-ruq"
                    value="pass"
                    checked={formData.os.ruq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-os-ruq"
                    value="fail"
                    checked={formData.os.ruq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>RLQ:</span>
                  <input
                    type="radio"
                    name="bedside-os-rlq"
                    value="pass"
                    checked={formData.os.rlq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-os-rlq"
                    value="fail"
                    checked={formData.os.rlq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                </div>
                <div className="flex items-center mt-2">
                  <span className="w-16" style={{ fontWeight: 'bold' }}>LUQ:</span>
                  <input
                    type="radio"
                    name="bedside-os-luq"
                    value="pass"
                    checked={formData.os.luq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-os-luq"
                    value="fail"
                    checked={formData.os.luq === "fail"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Fail</label>
                  <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>LLQ:</span>
                  <input
                    type="radio"
                    name="bedside-os-llq"
                    value="pass"
                    checked={formData.os.llq === "pass"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="mr-4">Pass</label>
                  <input
                    type="radio"
                    name="bedside-os-llq"
                    value="fail"
                    checked={formData.os.llq === "fail"}
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

export default EMR_BedSide;














