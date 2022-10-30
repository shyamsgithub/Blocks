"use strict";
let canvas = document.querySelector("canvas"); 
let canvasWidth = canvas.width;
let boxSize = canvasWidth / 10; //ten boxes per row
let canvasHeight = canvas.height;
let ctx = canvas.getContext("2d");
let state = Array(200).fill("."); 
let potentialShapes = ["i", "l", "r", "b", "t", "sl", "sr"];
let shapesThisRound = potentialShapes.slice(); //the game would loop through dropping each of the 7 shapes 
let droppedShape;
let currentOrientation;
const levelUpdateInterval = 0.5;
let updateInterval = levelUpdateInterval; //drop by a row every 0.5 second
let firstShape = shapePicker();
if (firstShape) {
    droppedShape = firstShape;
}
let currentTime, previousTime, timeOfLanding;
let movementCountsOnceLanded = 0;
let shapeLanded = false;
let scoreCount = 0;
let scoreCountP = document.getElementById("scoreCount");
let lineCount = 0;
let lineCountP = document.getElementById("lineCount");

function updateScoreCount(n) {
    scoreCount += n;
    scoreCountP.innerText = `${scoreCount.toString()}`;
}
function updateLineCount(n) {
    lineCount += n;
    lineCountP.innerText = `${lineCount.toString()}`;
}

//this function runs the animation
function draw() {
    currentTime = Date.now();
    if (!previousTime) {
        previousTime = currentTime;
    }
    if (directionDemanded !== "none") {
        let paramForDirectionHandler = null; //e.g. the function handleRotate takes an argument for direction 
        if (directionDemanded == "clockwise" || directionDemanded == "anticlockwise") {
            paramForDirectionHandler = directionDemanded;
        }
        if (shapeLanded && movementCountsOnceLanded < 15) {
            
            if (directionToFunctionMap[directionDemanded](paramForDirectionHandler)) {
                movementCountsOnceLanded++;
                timeOfLanding = undefined;
            }
        }
        else if (!shapeLanded) {
            directionToFunctionMap[directionDemanded](paramForDirectionHandler);
        }
        else {
            directionDemanded = "none";
        }
    }
    //
    if (fastDownDemanded) {
        updateInterval = 0.05;
        window.addEventListener("keyup", handleArrowDownUp);
        function handleArrowDownUp(event) {
            if (event.key === "ArrowDown") {
                fastDownDemanded = false;
            }
            window.removeEventListener("keyup", handleArrowDownUp);
        }
    }
    if (hardDownDemanded) {
        updateInterval = 0.015;
    }
    if ((currentTime - previousTime) / 1000 >= updateInterval) {
        let drop = handleDown();
        if (!drop) {
            //check if any rows are full and thus should be removed
            let removableRows = [];
            for (let r = 0; r < 20; r++) {
                let thisRow = state.slice(r * 10, r * 10 + 10);
                if (!thisRow.includes(".")) {
                    removableRows.push(r);
                }
            }
            if (removableRows.length > 0) {
                updateInterval = 0.1;
                for (let rr of removableRows) {
                    state.splice(rr * 10, 10, "w", "w", "w", "w", "w", "w", "w", "w", "w", "w");
                    updateView();
                }
                updateLineCount(removableRows.length);
                for (let rr of removableRows) {
                    state.splice(rr * 10, 10);
                    state.splice(0, 0, ".", ".", ".", ".", ".", ".", ".", ".", ".", ".");
                }
                let removableRowsScoreUpdateMap = { 1: 100, 2: 300, 3: 500, 4: 800 };
                updateScoreCount(removableRowsScoreUpdateMap[removableRows.length]);
                //
            }
            //
            let newShape = shapePicker();
            if (newShape) {
                droppedShape = newShape;
                shapeLanded = false;
            }
            else {
                return; //end game
            }
        }
        else {
            if (!hardDownDemanded) {
                updateInterval = levelUpdateInterval;
            }
        }
        previousTime = currentTime;
    }
    return window.requestAnimationFrame(draw);
}


function shapePicker() {
    currentOrientation = 0;
    let newShape = shapesThisRound[Math.floor(Math.random() * shapesThisRound.length)];
    while (newShape === droppedShape) {
        newShape = shapesThisRound[Math.floor(Math.random() * shapesThisRound.length)];
    }
    shapesThisRound.splice(shapesThisRound.indexOf(newShape), 1);
    if (shapesThisRound.length === 0) {
        shapesThisRound = potentialShapes.slice();
    }
    let positionsForShapes = { i: [3, 4, 5, 6], l: [13, 14, 15, 5], r: [3, 13, 14, 15], b: [4, 5, 14, 15], t: [4, 13, 14, 15], sl: [3, 4, 14, 15], sr: [4, 5, 13, 14] };
    let positionsForNewShape = positionsForShapes[newShape];
    if (positionsForNewShape.some((p) => {
        return state[p] !== ".";
    })) {
        return false;
    }
    for (let position of positionsForNewShape) {
        state[position] = newShape;
    }
    //
    return newShape;
}
let fastDownDemanded = false;
let hardDownDemanded = false;
let directionDemanded = "none";
let eventKeyToDirectionMap = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "clockwise", z: "anticlockwise" };
let directionToFunctionMap = { left: handleHorizontal, right: handleHorizontal, clockwise: handleRotate, anticlockwise: handleRotate };
window.addEventListener("keydown", (event) => {
    if (event.key in eventKeyToDirectionMap) {
        directionDemanded = eventKeyToDirectionMap[event.key];
    }
    //
    if (event.key === "ArrowDown") {
        fastDownDemanded = true;
    }
    if (event.key === " ") { //space pressed
        hardDownDemanded = true;
    }
    event.preventDefault();
});
draw();
//update position
function updateView() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    let colorMap = { i: "lightblue", l: "orange", r: "blue", b: "yellow", t: "purple", sl: "red", sr: "lightgreen", w: "white" };
    for (let cellNo = 0; cellNo < state.length; cellNo++) {
        let x = cellNo % 10, y = Math.floor(cellNo / 10);
        let cell = state[cellNo].toLowerCase();
        if (cell in colorMap) {
            ctx.fillStyle = colorMap[cell];
        }
        else {
            ctx.fillStyle = "black";
        }
        ctx.moveTo(x * boxSize, y * boxSize);
        ctx.fillRect(x * boxSize, y * boxSize, boxSize, boxSize);
    }
    //add gridlines
    ctx.strokeStyle = "white";
    for (let i = 1; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * boxSize, 0);
        ctx.lineTo(i * boxSize, canvasHeight);
        ctx.stroke();
    }
    for (let i = 1; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * boxSize);
        ctx.lineTo(canvasWidth, i * boxSize);
        ctx.stroke();
    }
}
function handleDown() {
    let oldCells = [], newCells = [];
    for (let cellNo = 0; cellNo < state.length; cellNo++) {
        if (state[cellNo] === droppedShape) {
            oldCells.push(cellNo);
        }
    }
    for (let oldCell of oldCells) {
        if ((state[oldCell + 10] === "." || oldCells.includes(oldCell + 10)) && oldCell + 10 < state.length) {
            newCells.push(oldCell + 10);
        }
    }
    if (oldCells.length === newCells.length) {
        if (hardDownDemanded) {
            updateScoreCount(2);
        }
        else if (fastDownDemanded) {
            updateScoreCount(1);
        }
        for (let oldCell of oldCells) {
            state[oldCell] = ".";
        }
        for (let newCell of newCells) {
            state[newCell] = droppedShape;
        }
        updateView();
        return true;
    }
    else {
        shapeLanded = true;
        if (hardDownDemanded) {
            hardDownDemanded = false;
        }
        if (!timeOfLanding) {
            timeOfLanding = currentTime;
        }
        if ((currentTime - timeOfLanding) < 500) { //give shape 0.5 second once landed before releasing new shape. Code above reset this timeOfLanding whenever shape is shifted when landed. 15 shifts allowed maximum, after which it is fully settled and new shape is created  
            return true;
        }
        timeOfLanding = undefined;
        for (let oldCell of oldCells) {
            state[oldCell] = state[oldCell].toUpperCase();
        }
        movementCountsOnceLanded = 0; //shape is fully settled so reset the counter for the new shape
        return false;
    }
}
function handleHorizontal() {
    let oldCells = [], newCells = [];
    for (let cellNo = 0; cellNo < state.length; cellNo++) {
        if (state[cellNo] === droppedShape) {
            oldCells.push(cellNo);
        }
    }
    if (directionDemanded === "left") {
        for (let oldCell of oldCells) {
            if ((state[oldCell - 1] === "." || oldCells.includes(oldCell - 1)) && oldCell - 1 >= 0 && (oldCell - 1) % 10 !== 9) {
                newCells.push(oldCell - 1);
            }
        }
    }
    else if (directionDemanded === "right") {
        for (let oldCell of oldCells) {
            if ((state[oldCell + 1] === "." || oldCells.includes(oldCell + 1)) && oldCell + 1 < state.length && (oldCell + 1) % 10 !== 0) {
                newCells.push(oldCell + 1);
            }
        }
    }
    directionDemanded = "none";
    if (oldCells.length === newCells.length) {
        for (let oldCell of oldCells) {
            state[oldCell] = ".";
        }
        for (let newCell of newCells) {
            state[newCell] = droppedShape;
        }
        updateView();
        return true;
    }
    else {
        return false;
    }
}
function handleRotate(direction) {
    directionDemanded = "none";
    if (droppedShape === "b") {
        return false;
    }
    let oldCells = [], newCells = [];
    for (let cellNo = 0; cellNo < state.length; cellNo++) {
        if (state[cellNo] === droppedShape) {
            oldCells.push(cellNo);
        }
    }
    let potentialNewCells = false;
    let iteration = 0;
    function determineNewCells(proposedCells, iteration, rotationType, direction) {
        let proposedColumns = proposedCells.map(e => e % 10); 
        let widthOfProposedColumns = Math.max(...proposedColumns) - Math.min(...proposedColumns);
        let found = false;
        if (widthOfProposedColumns <= 3 && Math.max(...proposedCells) < state.length && Math.min(...proposedCells) >= 0) {
            for (let cell of proposedCells) {
                if (!oldCells.includes(cell)) {
                    if (state[cell] !== ".") {
                        found = false;
                        break;
                    }
                }
                found = true;
            }
        }
        if (!found) {
            iteration++;
            if (iteration > 4) {
                return false;
            }
        
            if (droppedShape === "l" || droppedShape === "r" || droppedShape === "sl" || droppedShape === "sr" || droppedShape === "t") {
                //if 0-1 or 2-1
                if ((direction === "clockwise" && rotationType == 0) || (direction === "anticlockwise" && rotationType === 2)) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e - 1);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e - 10);
                        
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e + 31);
                        
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e - 1);
                    }
                }
                //1-0 or 1-2
                else if (rotationType === 1) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e + 1);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e + 10);
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e - 31);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e + 1);
                    }
                }
                //2-3 or 0-3
                else if ((rotationType === 2 && direction === "clockwise") || (rotationType === 0 && direction === "anticlockwise")) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e + 1);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e - 10);
                        
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e + 29);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e + 1);
                    }
                }
                //3-2 or 3-0
                else if (rotationType === 3) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e - 1);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e + 10);
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e - 29);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e - 1);
                    }
                }
            }
            if (droppedShape === "i") {
                //0-1 or 3-2
                if ((rotationType === 0 && direction === "clockwise") || (rotationType === 3 && direction === "anticlockwise")) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e - 2);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e + 3);
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e + 7);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e - 27);
                    }
                }
                //1-0 or 2-3
                else if ((rotationType === 1 && direction === "anticlockwise") || (rotationType === 2 && direction === "clockwise")) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e + 2);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e - 3);
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e - 7);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e + 27);
                    }
                }
                //1-2 or 0-3
                else if ((rotationType === 1 && direction === "clockwise") || (rotationType === 0 && direction === "anticlockwise")) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e - 1);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e + 3);
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e - 23);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e + 33);
                    }
                }
                //3-0 or 2-1
                else if ((rotationType === 3 && direction === "clockwise") || (rotationType === 2 && direction === "anticlockwise")) {
                    if (iteration === 1) {
                        proposedCells = proposedCells.map(e => e + 1);
                    }
                    else if (iteration === 2) {
                        proposedCells = proposedCells.map(e => e - 3);
                    }
                    else if (iteration === 3) {
                        proposedCells = proposedCells.map(e => e + 23);
                    }
                    else if (iteration === 4) {
                        proposedCells = proposedCells.map(e => e - 33);
                    }
                }
            }
            return determineNewCells(proposedCells, iteration, rotationType, direction);
        }
        return proposedCells;
    }
    let proposedCells0 = [];
    let allOrientationCells;
    let index;
    let orientation0Cells = [], orientation1Cells = [], orientation2Cells = [], orientation3Cells = [];
    if (droppedShape === "i") {
        if (direction === "clockwise") {
            orientation0Cells = [oldCells[1] - 1, oldCells[1], oldCells[1] + 1, oldCells[1] + 2];
            orientation1Cells = [oldCells[2] - 10, oldCells[2], oldCells[2] + 10, oldCells[2] + 20];
            orientation2Cells = [oldCells[2] - 2, oldCells[2] - 1, oldCells[2], oldCells[2] + 1];
            orientation3Cells = [oldCells[1] - 20, oldCells[1] - 10, oldCells[1], oldCells[1] + 10];
        }
        else {
            orientation0Cells = [oldCells[1] - 2, oldCells[1] - 1, oldCells[1], oldCells[1] + 1];
            orientation1Cells = [oldCells[2] - 20, oldCells[2] - 10, oldCells[2], oldCells[2] + 10];
            orientation2Cells = [oldCells[2] - 1, oldCells[2], oldCells[2] + 1, oldCells[2] + 2];
            orientation3Cells = [oldCells[1] - 10, oldCells[1], oldCells[1] + 10, oldCells[1] + 20];
        }
    }
    if (droppedShape === "l") {
        if (direction === "clockwise") {
            orientation0Cells = [oldCells[2] - 9, oldCells[2] - 1, oldCells[2], oldCells[2] + 1];
            orientation1Cells = [oldCells[2] - 10, oldCells[2], oldCells[2] + 10, oldCells[2] + 11];
            orientation2Cells = [oldCells[1] - 1, oldCells[1], oldCells[1] + 1, oldCells[1] + 9];
            orientation3Cells = [oldCells[1] - 11, oldCells[1] - 10, oldCells[1], oldCells[1] + 10];
        }
        else {
            orientation0Cells = [oldCells[1] - 9, oldCells[1] - 1, oldCells[1], oldCells[1] + 1];
            orientation1Cells = [oldCells[1] - 10, oldCells[1], oldCells[1] + 10, oldCells[1] + 11];
            orientation2Cells = [oldCells[2] - 1, oldCells[2], oldCells[2] + 1, oldCells[2] + 9];
            orientation3Cells = [oldCells[2] - 11, oldCells[2] - 10, oldCells[2], oldCells[2] + 10];
        }
    }
    if (droppedShape === "r") {
        if (direction === "clockwise") {
            orientation0Cells = [oldCells[1] - 11, oldCells[1] - 1, oldCells[1], oldCells[1] + 1];
            orientation1Cells = [oldCells[2] - 10, oldCells[2] - 9, oldCells[2], oldCells[2] + 10];
            orientation2Cells = [oldCells[2] - 1, oldCells[2], oldCells[2] + 1, oldCells[2] + 11];
            orientation3Cells = [oldCells[1] - 10, oldCells[1], oldCells[1] + 9, oldCells[1] + 10];
        }
        else {
            orientation0Cells = [oldCells[2] - 11, oldCells[2] - 1, oldCells[2], oldCells[2] + 1];
            orientation1Cells = [oldCells[1] - 10, oldCells[1] - 9, oldCells[1], oldCells[1] + 10];
            orientation2Cells = [oldCells[1] - 1, oldCells[1], oldCells[1] + 1, oldCells[1] + 11];
            orientation3Cells = [oldCells[2] - 10, oldCells[2], oldCells[2] + 9, oldCells[2] + 10];
        }
    }
    if (droppedShape === "sl") {
        if (direction === "clockwise") {
            orientation0Cells = [oldCells[2] - 11, oldCells[2] - 10, oldCells[2], oldCells[2] + 1];
            orientation1Cells = [oldCells[2] - 9, oldCells[2], oldCells[2] + 1, oldCells[2] + 10];
            orientation2Cells = [oldCells[1] - 1, oldCells[1], oldCells[1] + 10, oldCells[1] + 11];
            orientation3Cells = [oldCells[1] - 10, oldCells[1] - 1, oldCells[1], oldCells[1] + 9];
        }
        else {
            orientation0Cells = [oldCells[1] - 11, oldCells[1] - 10, oldCells[1], oldCells[1] + 1];
            orientation1Cells = [oldCells[1] - 9, oldCells[1], oldCells[1] + 1, oldCells[1] + 10];
            orientation2Cells = [oldCells[2] - 1, oldCells[2], oldCells[2] + 10, oldCells[2] + 11];
            orientation3Cells = [oldCells[2] - 10, oldCells[2] - 1, oldCells[2], oldCells[2] + 9];
        }
    }
    if (droppedShape === "sr") {
        if (direction === "clockwise") {
            orientation0Cells = [oldCells[2] - 10, oldCells[2] - 9, oldCells[2] - 1, oldCells[2]];
            orientation1Cells = [oldCells[3] - 10, oldCells[3], oldCells[3] + 1, oldCells[3] + 11];
            orientation2Cells = [oldCells[1], oldCells[1] + 1, oldCells[1] + 9, oldCells[1] + 10];
            orientation3Cells = [oldCells[0] - 11, oldCells[0] - 1, oldCells[0], oldCells[0] + 10];
        }
        else {
            orientation0Cells = [oldCells[1] - 10, oldCells[1] - 9, oldCells[1] - 1, oldCells[1]];
            orientation1Cells = [oldCells[0] - 10, oldCells[0], oldCells[0] + 1, oldCells[0] + 11];
            orientation2Cells = [oldCells[2], oldCells[2] + 1, oldCells[2] + 9, oldCells[2] + 10];
            orientation3Cells = [oldCells[3] - 11, oldCells[3] - 1, oldCells[3], oldCells[3] + 10];
        }
    }
    if (droppedShape === "t") {
        if (direction === "clockwise") {
            orientation0Cells = [oldCells[2] - 10, oldCells[2] - 1, oldCells[2], oldCells[2] + 1];
            orientation1Cells = [oldCells[2] - 10, oldCells[2], oldCells[2] + 1, oldCells[2] + 10];
            orientation2Cells = [oldCells[1] - 1, oldCells[1], oldCells[1] + 1, oldCells[1] + 10];
            orientation3Cells = [oldCells[1] - 10, oldCells[1] - 1, oldCells[1], oldCells[1] + 10];
        }
        else {
            orientation0Cells = [oldCells[1] - 10, oldCells[1] - 1, oldCells[1], oldCells[1] + 1];
            orientation1Cells = [oldCells[1] - 10, oldCells[1], oldCells[1] + 1, oldCells[1] + 10];
            orientation2Cells = [oldCells[2] - 1, oldCells[2], oldCells[2] + 1, oldCells[2] + 10];
            orientation3Cells = [oldCells[2] - 10, oldCells[2] - 1, oldCells[2], oldCells[2] + 10];
        }
    }
    allOrientationCells = [orientation0Cells, orientation1Cells, orientation2Cells, orientation3Cells];
    if (direction === "clockwise") {
        index = (currentOrientation + 1) % allOrientationCells.length;
    }
    else {
        index = (currentOrientation - 1) < 0 ? (allOrientationCells.length - 1) : ((currentOrientation - 1) % allOrientationCells.length);
    }
    proposedCells0 = allOrientationCells[index];
    //
    potentialNewCells = determineNewCells(proposedCells0, iteration, currentOrientation, direction);
    if (potentialNewCells) {
        newCells = potentialNewCells;
        if (direction === "clockwise") {
            if (currentOrientation < 3) {
                currentOrientation++;
            }
            else {
                currentOrientation = 0;
            }
        }
        else {
            if (currentOrientation > 0) {
                currentOrientation--;
            }
            else {
                currentOrientation = 3;
            }
        }
    }
    //
    if (newCells.length > 0) {
        for (let oldCell of oldCells) {
            state[oldCell] = ".";
        }
        for (let newCell of newCells) {
            state[newCell] = droppedShape;
        }
        updateView();
        return true;
    }
    else {
        return false;
    }
}

