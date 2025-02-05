import React, { useState } from 'react';

function QuadrantTracking({ settings, updateSetting }) {
    const [selectedShape, setSelectedShape] = useState("circle");
    const gridSize = 5; // 5x5 matrix

    const handleShapeChange = (e) => {
        const value = e.target.value;
        setSelectedShape(value);
        updateSetting("shape", value);
    };

    const handleButtonClick = (row, col) => {
        const numRows = 4;
        const numCols = 4;
        const screenWidth = 2880;
        const screenHeight = 1440;

        const screenX = (col / numCols) * screenWidth;
        const screenY = (row / numRows) * screenHeight;

        const coordinates = { x: screenX, y: screenY };
        updateSetting("coordinates", coordinates);
    };

    return (
        <div style={styles.container}>
            <p className="font-bold text-lg">Select Quadrant Shape</p>
            <select onChange={handleShapeChange} value={selectedShape}>
                <option value="circle">Circle</option>
                <option value="star">Star</option>
                <option value="square">Square</option>
            </select>

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
    },
    matrix: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: "10px"
    },
    row: {
        display: 'flex',
    },
    button: {
        backgroundColor: 'blue',
        color: 'white',
        border: '1px solid #ddd',
        fontSize: 16,
        width: 40,
        height: 40,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default QuadrantTracking;
