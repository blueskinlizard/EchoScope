import { useRef, useState, useEffect } from "react";

export default function RadioGraph({ radioGraphID }) {
    const [imageURL, setImageURL] = useState(null);
    const canvasRef = useRef();

    useEffect(() => {
        const fetchRadioGraph = async () => {
            try{
                const response = await fetch('http://localhost:8080/api/fetchIQGraph', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ radioGraphID })
                });

                if(!response.ok) throw new Error("Image fetch failed");

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setImageURL(url);
            } catch(error) {
                console.error("Error fetching image:", error);
            }
        };

        if(radioGraphID) {
            fetchRadioGraph();
        }
    }, [radioGraphID]);

    useEffect(() => {
        if (imageURL && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvasRef.current.width = img.width;
                canvasRef.current.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = imageURL;
        }
    }, [imageURL]);

    return (
        <div className="RadioGraph">
            <h3>Radio Graph</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}
