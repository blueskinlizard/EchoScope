import { useState } from "react";
import RadioGraph from "./RadioGraph";
import InformationSegment from "./InformationSegment";
export default function FileUploader(){
    const [file, setFile] = useState();
    const [data, setData] = useState([]);
    const [error, setError] = useState();

    const handleUpload = async () => {
        console.log("Handling upload...");
        if(!file) {
            console.log("File state null, returning");
            return;
        }
        if(!file.name.endsWith(".wav")) {
            setError("Only valid .wav files are allowed.");
            setFile(null);
            return;
        }
        const audioURL = URL.createObjectURL(file);
        const audio = new Audio(audioURL);

        audio.onloadedmetadata = async () => {

            const duration = audio.duration;
            console.log("Audio duration:", duration);
            if(duration > 3) {
                setError("File must be less than 3 seconds long.");
                setFile(null);
                return;
            }
            const formData = new FormData();
            formData.append("file", file);
            console.log(file.type)
            console.log("Appended formData...");
            try{
                const res = await fetch("http://localhost:8080/api/uploadSound", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                setData(data);
                setError(""); 
                console.log("Upload response:", data);
            }catch(error) {
                console.error("Error in receiving file upload:", error);
                setError("Failed to upload file.");
            }
        };

        audio.onerror = () => {
            setError("Could not read the file as audio.");
        };
    };


    return(
        <div className="fileUploader">
            {error && (
                <div className="errorWrapper">
                    <h3>Error!</h3>
                    <p>{error}</p>
                </div>
            )}
            <input type="file" accept=".wav" placeholder="Upload .wav file" onChange={target => {setFile(target.target.files[0]); console.log("Set file state")}}/>
            <button onClick={handleUpload}>Upload</button>
            {data.length > 0 && (
                <div className="responseWrapper">
                    <h2>Radio Graph:</h2>
                    <RadioGraph radioGraphID={data.fileID} />
                    <h2>About This Signal:</h2>
                    <InformationSegment />
                </div>
            )}
        </div>
    )
}