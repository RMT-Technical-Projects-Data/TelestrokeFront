import React from 'react';
import axios from 'axios';

function QuadrantTracking({settings, updateSetting} ) {
    const gridSize = 5; // 5x5 matrix

    // // Function to handle button clicks
    // const handleButtonClick = (row, col) => {
    //     const coordinates = { x: col * 80, y: row * 150 };
        

    //     // Send coordinates to the server via POST request
    //     axios.post('http://localhost:5000/webhook', coordinates)
    //         .then(response => {
    //             console.log('Coordinates sent:', response.data);
    //         })
    //         .catch(error => {
    //             console.error('There was an error sending the coordinates!', error);
    //         });
    // };

    const handleButtonClick = (row, col) => {
    
        // Assuming 5x5 grid and screen dimensions of 1920x1440
        const numRows = 4;
        const numCols = 4;
        const screenWidth = 1920;
        const screenHeight = 1080;

        // Map matrix coordinates to screen coordinates
        const screenX = (col / (numCols)) * (screenWidth); // Adjust for red dot width
        const screenY = (row / (numRows)) * (screenHeight); // Adjust for red dot height

        const coordinates = { x: screenX, y: screenY };
        updateSetting("coordinates", coordinates)
        // Send coordinates to the server via POST request
        // axios.post('http://localhost:5000/webhook', coordinates)
        //     .then(response => {
        //         console.log('Coordinates sent:', response.data);
        //     })
        //     .catch(error => {
        //         console.error('There was an error sending the coordinates!', error);
        //     });
    };

    return (
        <div style={styles.container}>
            <h1 className="font-bold text-lg">Button Matrix</h1>
            <div style={styles.matrix}>
                {[...Array(gridSize)].map((_, row) => (
                    <div key={row} style={styles.row}>
                        {[...Array(gridSize)].map((_, col) => (
                            <button
                                key={col}
                                style={styles.button}
                                onClick={() => handleButtonClick(row, col)}
                            >
                                {row + 1},{col + 1}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
 // Full viewport height
    },
    matrix: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin_top:"90px"
    },
    row: {
        display: 'flex',
    },
    button: {
        backgroundColor: 'blue',
        color: 'white',
        border: '1px solid #ddd',
        fontSize: 16,
        width: 40, // Fixed width
        height: 40, // Fixed height
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default QuadrantTracking;
