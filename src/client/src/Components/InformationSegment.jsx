import { useState, useEffect } from "react";
export default function InformationSegment(props){
    const [largestPrediction, setLargestPrediction] = useState()
    console.log("Probabilties: "+props.predictions)

    useEffect(() =>{
        const find_largest_prediction = (array) =>{
            let maxVal = array[0];
            for(let i = 1; i < array.length; i++){
                if(array[i] > maxVal){
                    maxVal = array[i];
                }
            }
            return maxVal;
        }

        if(props.predictions && props.predictions.length > 0){
            let largest = find_largest_prediction(props.predictions);
            largest = parseFloat(largest);
            setLargestPrediction(Math.round(largest * 100));
        }
    }, [props.predictions])


    const prediction_map = {
        0: 'AM',
        1: 'FM',
        2: 'FSK',
        3: 'PAM',
        4: 'PSK',
        5: 'QAM'
    }
    return(
        <div className="InformationSegment">
            {largestPrediction !== undefined && (
                <h2>Predicted class: {prediction_map[props.predicted_class]} with a {largestPrediction}% confidence</h2>
            )}
        </div>
    )
}
