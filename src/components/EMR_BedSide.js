import React, { useState } from "react";

function EMR_BedSide() {
  const [formData, setFormData] = useState({
    spas: "", // Smooth Pursuit and Saccades
    nys: null, // Has Nystagmus (boolean)
    gt: "", // Gaze Type
    spastext:"",
    exmtext:"",
    od: { ruq: null, rlq: null, luq: null, llq: null }, // Visual Fields OD
    exm: "", // Extraocular Movement
    nyd: "", // Nystagmus Degree
    examTolerated: null, // Exam Tolerated (boolean)
    os: { ruq: null, rlq: null, luq: null, llq: null }, // Visual Fields OS
  });

  const handleChange = (e) => {
    debugger
    const { name, type, value, checked } = e.target;
  
    if (type === "radio") {
      if (name.startsWith("od-") || name.startsWith("os-")) {
        // Update fields for "od-" and "os-" prefixes
        const [field, region] = name.split("-");
        setFormData((prevState) => ({
          ...prevState,
          [field]: {
            ...prevState[field],
            [region]: checked ? value : null,
          },
        }));
      } else if (name === "nys" || name === "examTolerated") {
        // Handle boolean radio buttons
        setFormData((prevState) => ({
          ...prevState,
          [name]: checked ? value === "true" : false,
        }));
      } else {
        // Handle other radio buttons and input changes
        setFormData((prevState) => ({
          ...prevState,
          [name]: checked ? value : "",
        }));
      }
    } else {
      // Handle non-radio inputs
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };
  

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-row gap-16 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">
            Smooth Pursuit and Saccades
          </p>
          <input
            className="inline m-2"
            name="spas"
            type="radio"
            value="Normal"
            checked={formData.spas === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="spas"
            type="radio"
            value="Abnormal"
            checked={formData.spas === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="spastext"
            value={formData.spastext}
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
              checked={formData.nys === true}
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
              checked={formData.nys === false}
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
              checked={formData.gt === "Conjugate"}
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
              checked={formData.gt === "Dysconjugate"}
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

                <span className="w-16 ml-24">RLQ</span>
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
                <span className="w-16">LUQ</span>
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

                <span className="w-16 ml-24">LLQ</span>
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
      <div className="flex flex-row gap-16 justify-between">
        <div className="basis-2/4">
          <p className="font-bold text-lg inline mr-4">Extraocular Movement</p>
          <input
            className="inline m-2"
            name="exm"
            type="radio"
            value="Normal"
            checked={formData.exm === "Normal"}
            onChange={handleChange}
          />
          <label>Normal</label>
          <input
            className="inline m-2"
            name="exm"
            type="radio"
            value="Abnormal"
            checked={formData.exm === "Abnormal"}
            onChange={handleChange}
          />
          <label>Abnormal</label>
          <textarea
            className="h-20 block w-[100%]"
            name="exmtext"
            value={formData.exmtext}
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
              checked={formData.nyd === "first"}
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
              checked={formData.nyd === "second"}
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
              checked={formData.nyd === "third"}
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
                <span className="w-16">RUQ</span>
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

                <span className="w-16 ml-24">RLQ</span>
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
                <span className="w-16">LUQ</span>
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

                <span className="w-16 ml-24">LLQ</span>
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
    </div>
  );
}

export default EMR_BedSide;

// import React from "react";

// function EMR_BedSide() {
//   return (
//     <div className="flex flex-col gap-12">
//       <div className="flex flex-row gap-16 justify-between">
//         <div className="basis-2/4">
//           <p className="font-bold text-lg inline mr-4">
//             Smooth Pursuit asn Saccades
//           </p>
//           <input
//             className="inline m-2"
//             name="spas"
//             type="radio"
//             value="Normal"
//           />
//           <label>Normal</label>
//           <input
//             className="inline m-2"
//             name="spas"
//             type="radio"
//             value="Abnormal"
//           />
//           <label>Abnormal</label>
//           <textarea className="h-20 block w-[100%]"> test </textarea>
//         </div>
//         <div className="basis-1/4">
//           <p className="font-bold">Has Nystagmus</p>
//           <div>
//             <input className="m-2 " name="nys" type="radio" value="Yes" />
//             <label>Yes</label>
//           </div>
//           <div>
//             <input className="m-2 " name="nys" type="radio" value="No" />
//             <label>No</label>
//           </div>
//         </div>

//         <div className="basis-1/4">
//           <p className="font-bold"> Gaze Type</p>
//           <div>
//             <input className=" m-2" name="gt" type="radio" value="Conjugate" />
//             <label>Conjugate</label>
//           </div>
//           <div>
//             <input
//               className=" m-2"
//               name="gt"
//               type="radio"
//               value="Dysconjugate"
//             />
//             <label>Dysconjugate</label>
//           </div>
//         </div>
//         <div className="basis-2/4">
//           <p className="text-center font-bold">Visual Fields: OD </p>
//           <div>
//             <div className="mt-2">
//               <div className="flex items-center">
//                 <span className="w-16">RUQ</span>
//                 <input
//                   type="radio"
//                   name="od-ruq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="od-ruq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>

//                 <span className="w-16 ml-24">RLQ</span>
//                 <input
//                   type="radio"
//                   name="od-rlq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="od-rlq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>
//               </div>
//               <div className="flex items-center mt-2">
//                 <span className="w-16">LUQ</span>
//                 <input
//                   type="radio"
//                   name="od-luq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="od-luq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>

//                 <span className="w-16 ml-24">LLQ</span>
//                 <input
//                   type="radio"
//                   name="od-llq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="od-llq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="flex flex-row gap-16 justify-between">
//         <div className="basis-2/4">
//           <p className="font-bold text-lg inline mr-4">
//             Extraocular Movement
//           </p>
//           <input
//             className="inline m-2"
//             name="exm"
//             type="radio"
//             value="Normal"
//           />
//           <label>Normal</label>
//           <input
//             className="inline m-2"
//             name="exm"
//             type="radio"
//             value="Abnormal"
//           />
//           <label>Abnormal</label>
//           <textarea className="h-20 block w-[100%]"> test </textarea>
//         </div>
//         <div className="basis-1/4">
//           <p>Nystagmus Degree </p>
//           <div>
//             <input className="m-2 " name="nyd" type="radio" value="first" />
//             <label>First</label>
//           </div>
//           <div>
//             <input className="m-2 " name="nyd" type="radio" value="second" />
//             <label>Second</label>
//           </div>
//           <div>
//             <input className="m-2 " name="nyd" type="radio" value="third" />
//             <label>Third</label>
//           </div>
//         </div>

//         <div className="basis-1/4">
//           <p>Exam Tolerated </p>
//           <div>
//             <input className=" m-2" name="gt" type="radio" value="yes" />
//             <label>yes</label>
//           </div>
//           <div>
//             <input
//               className=" m-2"
//               name="gt"
//               type="radio"
//               value="No"
//             />
//             <label>No</label>
//           </div>
//         </div>
//         <div className="basis-2/4">
//           <p className="text-center font-bold">Visual Fields: OS </p>
//           <div>
//             <div className="mt-2">
//               <div className="flex items-center">
//                 <span className="w-16">RUQ</span>
//                 <input
//                   type="radio"
//                   name="os-ruq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="os-ruq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>

//                 <span className="w-16 ml-24">RLQ</span>
//                 <input
//                   type="radio"
//                   name="os-rlq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="os-rlq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>
//               </div>
//               <div className="flex items-center mt-2">
//                 <span className="w-16">LUQ</span>
//                 <input
//                   type="radio"
//                   name="os-luq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="os-luq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>

//                 <span className="w-16 ml-24">LLQ</span>
//                 <input
//                   type="radio"
//                   name="os-llq"
//                   value="pass"
//                   className="mr-2"
//                 />
//                 <label className="mr-4">Pass</label>
//                 <input
//                   type="radio"
//                   name="os-llq"
//                   value="fail"
//                   className="mr-2"
//                 />
//                 <label>Fail</label>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default EMR_BedSide;
