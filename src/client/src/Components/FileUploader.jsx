import { useState } from "react";
import RadioGraph from "./RadioGraph";
import InformationSegment from "./InformationSegment";
export default function FileUploader(){
    const [file, setFile] = useState();
    const [data, setData] = useState([]);
    const [error, setError] = useState();

    const handleUpload = async() =>{
        console.log("Handling upload...")
        if(!file){ console.log("File state null, returning"); return; }

        if (!file.name.endsWith(".wav")) {
            setError("Only .wav files are allowed.");
            setFile(null);
            return;
        }
        const audioContext = new AudioContext();
        const arrayBuffer = await uploadedFile.arrayBuffer();

        const formData = new FormData();
        formData.append('file', file);
        console.log("Appended formData...")
        try{
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const duration = audioBuffer.duration;

            if (duration > 3) {
                setError("File must be less than 3 seconds long.");
                setFile(null);
            } else {
                setError("");
                setFile(uploadedFile);
                console.log("Set file state");
            }
            
            const res = await fetch('http://localhost:8080/api/uploadSound', {
                method: 'POST',
                body: formData
            })
            const data = await res.json();
            setData(data);
            console.log("Uplaod response: "+data)
        }catch(error){
            console.error("Error in receiving file upload: "+error)
        }
    }

    return(
        <div className="fileUploader">
            {error && (
                <div className="errorWrapper">
                    <h3>Error!</h3>
                    <p>{error}</p>
                </div>
            )}
            <input type="file" placeholder="Upload .wav file" onChange={target => {setFile(target.target.files[0]); console.log("Set file state")}}/>
            <button onClick={handleUpload}>Upload</button>
            {data && (
                <div className="responseWrapper">
                    <h2>Radio Graph:</h2>
                    <RadioGraph />
                    <h2>About This Signal:</h2>
                    <InformationSegment />
                </div>
            )}
        </div>
    )
}