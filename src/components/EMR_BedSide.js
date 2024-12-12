import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EMR_BedSide() {
  const [formData, setFormData] = useState({
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
        setFormData((prevState) => ({
          ...prevState,
          [field]: {
            ...prevState[field],
            [region]: checked ? value : null,
          },
        }));
      } else if (name === "hasNystagmus" || name === "examTolerated") {
        setFormData((prevState) => ({
          ...prevState,
          [name]: checked ? value === "true" : false,
        }));
      } else {
        setFormData((prevState) => ({
          ...prevState,
          [name]: checked ? value : "",
        }));
      }
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSet = () => {
    // Validation check for empty fields
    for (const key in formData) {
      if (formData[key] === "") {
        toast.error(`Please fill in all fields. Missing field: ${key}`);
        return;
      }
    }
    setSavedData(formData);
    localStorage.setItem("emrBedSideData", JSON.stringify(formData)); // Save to local storage
    toast.success("EMR_BedSide information Set.");
    // console.log("EMR_BedSide Info:", formData);
  };
  

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-8 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">Smooth Pursuit and Saccades</p>
          <input
            className="inline m-2"
            name="smoothPursuitAndSaccadesResult"
            type="radio"
            value="Normal"
            checked={formData.smoothPursuitAndSaccadesResult === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="smoothPursuitAndSaccadesResult"
            type="radio"
            value="Abnormal"
            checked={formData.smoothPursuitAndSaccadesResult === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="smoothPursuitAndSaccadesDescription"
            value={formData.smoothPursuitAndSaccadesDescription}
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
              checked={formData.hasNystagmus === true}
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
              name="gazeType"
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
              name="gazeType"
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
                  name="od-ruq"
                  value="pass"
                  checked={formData.od.ruq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-ruq"
                  value="fail"
                  checked={formData.od.ruq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>RLQ:</span>
                <input
                  type="radio"
                  name="od-rlq"
                  value="pass"
                  checked={formData.od.rlq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-rlq"
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
                  name="od-luq"
                  value="pass"
                  checked={formData.od.luq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-luq"
                  value="fail"
                  checked={formData.od.luq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>LLQ:</span>
                <input
                  type="radio"
                  name="od-llq"
                  value="pass"
                  checked={formData.od.llq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="od-llq"
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
            name="extraocularMovementResult"
            type="radio"
            value="Normal"
            checked={formData.extraocularMovementResult === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="extraocularMovementResult"
            type="radio"
            value="Abnormal"
            checked={formData.extraocularMovementResult === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="extraocularMovementDescription"
            value={formData.extraocularMovementDescription}
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
              checked={formData.nystagmusDegree === "First"}
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
              checked={formData.nystagmusDegree === "Second"}
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
              checked={formData.nystagmusDegree === "Third"}
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
              checked={formData.examTolerated === true}
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
                  name="os-ruq"
                  value="pass"
                  checked={formData.os.ruq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-ruq"
                  value="fail"
                  checked={formData.os.ruq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>RLQ:</span>
                <input
                  type="radio"
                  name="os-rlq"
                  value="pass"
                  checked={formData.os.rlq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-rlq"
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
                  name="os-luq"
                  value="pass"
                  checked={formData.os.luq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-luq"
                  value="fail"
                  checked={formData.os.luq === "fail"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label>Fail</label>
                <span className="w-16 ml-24" style={{ fontWeight: 'bold' }}>LLQ:</span>
                <input
                  type="radio"
                  name="os-llq"
                  value="pass"
                  checked={formData.os.llq === "pass"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="mr-4">Pass</label>
                <input
                  type="radio"
                  name="os-llq"
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
      <button className="mt-2 bg-blue-500 text-white px-2 py-1 rounded w-24 text-sm" onClick={handleSet}>
        Set
      </button>
      <ToastContainer />
    </div>
  );
}

export default EMR_BedSide;














