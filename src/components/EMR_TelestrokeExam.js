import React, { useState } from "react";

function EMR_TelestrokeExam() {
  const [formData1, setFormData1] = useState({
    smoothPursuitAndSaccadesResult: "", // Smooth Pursuit and Saccades
    hasNystagmus: null, // Has Nystagmus (boolean)
    gazeType: "", // Gaze Type
    smoothPursuitAndSaccadesDescription: "",
    extraocularMovementDescription: "",
    od: { ruq: null, rlq: null, luq: null, llq: null }, // Visual Fields OD
    extraocularMovementResult: "", // Extraocular Movement
    nystagmusDegree: "", // Nystagmus Degree
    examTolerated: null, // Exam Tolerated (boolean)
    os: { ruq: null, rlq: null, luq: null, llq: null }, // Visual Fields OS
  });

  const [savedData, setSavedData] = useState(null);

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
      } else if (name === "nys" || name === "examTolerated") {
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
    setSavedData(formData1);
    alert("EMR_Telestroke information set.");
    console.log("EMR_Telestroke Info:", formData1);
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-row gap-16 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">Smooth Pursuit and Saccades</p>
          <input
            className="inline m-2"
            name="spas"
            type="radio"
            value="Normal"
            checked={formData1.spas === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="spas"
            type="radio"
            value="Abnormal"
            checked={formData1.spas === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="spastext"
            value={formData1.spastext}
            onChange={handleChange}
          />
        </div>
        <div className="basis-1/4">
          <p className="font-bold">Has Nystagmus</p>
          <div>
            <input
              className="m-2"
              name="nys"
              type="radio"
              value="true"
              checked={formData1.nys === true}
              onChange={handleChange}
            />
            <label>Yes</label>
          </div>
          <div>
            <input
              className="m-2"
              name="nys"
              type="radio"
              value="false"
              checked={formData1.nys === false}
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
              name="gt"
              type="radio"
              value="Conjugate"
              checked={formData1.gt === "Conjugate"}
              onChange={handleChange}
            />
            <label>Conjugate</label>
          </div>
          <div>
            <input
              className="m-2"
              name="gt"
              type="radio"
              value="Dysconjugate"
              checked={formData1.gt === "Dysconjugate"}
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
                <span className="w-16">RUQ</span>
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
                <span className="w-16 ml-24">RLQ</span>
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
                <span className="w-16">LUQ</span>
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
                <span className="w-16 ml-24">LLQ</span>
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
      <div className="flex flex-row gap-16 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">Extraocular Movement</p>
          <input
            className="inline m-2"
            name="exm"
            type="radio"
            value="Normal"
            checked={formData1.exm === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="exm"
            type="radio"
            value="Abnormal"
            checked={formData1.exm === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="exmtext"
            value={formData1.exmtext}
            onChange={handleChange}
          />
        </div>
        <div className="basis-1/4">
          <p>Nystagmus Degree</p>
          <div>
            <input
              className="m-2"
              name="nyd"
              type="radio"
              value="first"
              checked={formData1.nyd === "first"}
              onChange={handleChange}
            />
            <label>First</label>
          </div>
          <div>
            <input
              className="m-2"
              name="nyd"
              type="radio"
              value="second"
              checked={formData1.nyd === "second"}
              onChange={handleChange}
            />
            <label>Second</label>
          </div>
          <div>
            <input
              className="m-2"
              name="nyd"
              type="radio"
              value="third"
              checked={formData1.nyd === "third"}
              onChange={handleChange}
            />
            <label>Third</label>
          </div>
        </div>
        <div className="basis-1/4">
          <p>Exam Tolerated</p>
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
                <span className="w-16">RUQ</span>
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
                <span className="w-16 ml-24">RLQ</span>
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
                <span className="w-16">LUQ</span>
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
                <span className="w-16 ml-24">LLQ</span>
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
      <button className="mt-4 bg-blue-500 text-white px-2 py-1 rounded w-24 text-sm" onClick={handleSet}>
        Set
      </button>
    </div>
  );
}

export default EMR_TelestrokeExam;


