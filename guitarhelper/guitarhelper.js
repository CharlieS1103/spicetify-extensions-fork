/// <reference path="../@types/spicetify.d.ts" />

(function guitarHelper() {
    const { CosmosAsync, Player} = Spicetify;

    if (!(CosmosAsync || !(Player))) {
        setTimeout(guitarHelper, 300);
        return;
    }
    console.log("guitarHelper loaded");
    const BUTTON_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--spice-text)" width="24px" height="24px">
       <path xmlns="http://www.w3.org/2000/svg" d="M497.624,14.376c-19.168-19.168-50.247-19.168-69.414,0l-27.065,27.065c-5.939,5.939-5.939,15.569,0,21.509l1.176,1.176    l-79.195,79.195c-45.748-30.539-100.118-32.422-131.329-1.21c-8.248,8.248-14.184,18.115-17.89,29.012    c-7.107,20.896-26.2,35.402-48.236,36.653c-32.612,1.851-63.585,14.452-87.279,38.145    c-55.818,55.818-50.099,152.039,12.776,214.913c62.874,62.874,159.094,68.594,214.913,12.776    c23.693-23.693,36.296-54.666,38.145-87.279c1.25-22.035,15.758-41.13,36.653-48.236c10.897-3.706,20.763-9.642,29.012-17.89    c31.21-31.211,29.329-85.58-1.21-131.329l79.195-79.195l1.176,1.176c5.939,5.939,15.569,5.939,21.509,0l27.065-27.065    C516.793,64.623,516.793,33.544,497.624,14.376z M177.537,440.034c-3.6,3.599-8.318,5.399-13.037,5.399s-9.437-1.8-13.037-5.399    l-79.496-79.496c-7.2-7.201-7.2-18.874,0-26.075c7.201-7.2,18.874-7.2,26.075,0l79.496,79.496    C184.736,421.16,184.736,432.833,177.537,440.034z M291.349,296.737c-21.011,21.011-55.075,21.011-76.086,0    c-21.011-21.011-21.011-55.075,0-76.086s55.075-21.011,76.086,0C312.36,241.662,312.358,275.727,291.349,296.737z"/>
    </svg>
    `;

    new Spicetify.Topbar.Button("Show Scale Shapes", BUTTON_ICON, displayScaleShapes, false);
}());

    const pitchClasses = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"];

    async function getCurrentSongKey() {
        const trackUri = Spicetify.Player.data.item.uri;
        const trackId = trackUri.split(":")[2];
        const audioFeatures = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/audio-features/${trackId}`);
    
        if (audioFeatures.key === -1) {
            return { key: "Undefined", mode: null };
        }
    
        const key = pitchClasses[audioFeatures.key];
        const mode = audioFeatures.mode === 1 ? "Major" : "Minor"; // Determine if it's Major or Minor
        return { key, mode };
    }
    
    function generateScaleHTML(keyObject) {
        let fretboardHTML = `<div style="display: flex; flex-wrap: wrap; gap: 2%; justify-content: center;">`;
    
        for (const [key, data] of Object.entries(keyObject)) {
            fretboardHTML += `
                <div style="text-align: center; width: 90%; max-width: 600px;">
                    <h2>${key}</h2>
                    ${data.positions.map(pos => {
                        const allFrets = pos.frets.flat();
                        const minFret = Math.min(...allFrets);
                        const maxFret = Math.max(...allFrets);
                        const numFrets = maxFret - minFret + 1;
    
                        return `
                            <div style="text-align: center; margin-bottom: 2%; width: 100%;">
                                <p>Position ${pos.position}</p>
                                <div style="display: grid; grid-template-columns: repeat(${numFrets + 1}, 1fr); grid-template-rows: repeat(6, 5vh); gap: 1%; border: 1px solid black; border-left: 5px solid black; padding: 1%; position: relative;">
                                    <!-- Strings -->
                                    ${Array.from({ length: 6 }, (_, stringIdx) => `
                                        <div style="position: absolute; top: ${stringIdx * 5}vh; left: 0; width: 100%; height: 0.5vh; background: gray;"></div>
                                    `).join('')}
                                    
                                    <!-- Fret Lines -->
                                    ${Array.from({ length: numFrets }, (_, fretIdx) => `
                                        <div style="position: absolute; top: 0; left: ${(fretIdx + 1) * 100 / (numFrets + 1)}%; width: 0.2%; height: 30vh; background: black;"></div>
                                    `).join('')}
                                    
                                    <!-- Notes -->
                                    ${Array.from({ length: 6 }, (_, stringIdx) => 
                                        Array.from({ length: numFrets }, (_, fretIdx) => {
                                            const actualFret = minFret + fretIdx;
                                            const isNote = pos.frets[stringIdx].includes(actualFret);
                                            const isRoot = actualFret === pos.root;
    
                                            return `
                                                <div style="width: 4vh; height: 4vh; border-radius: 50%; 
                                                    background: ${isNote ? (isRoot ? 'red' : 'black') : 'transparent'}; 
                                                    border: ${isNote ? '0.1vh solid black' : 'none'}; 
                                                    display: flex; align-items: center; justify-content: center;
                                                    position: absolute; 
                                                    top: calc(${stringIdx * 5}vh - 2vh); 
                                                    left: calc(${((fretIdx + 1) * 100 / (numFrets + 1)) - 10}% - 2vh);">
                                                    ${isNote ? actualFret : ''}
                                                </div>`;
                                        }).join('')
                                    ).join('')}
                                </div>
    
                                <!-- Fret Numbers Below -->
                                <div style="display: flex; justify-content: center; margin-top: 1%; font-size: 1.5vh;">
                                    ${Array.from({ length: numFrets + 1 }, (_, fretIdx) => `
                                        <span style="flex: 1; text-align: center;">${minFret + fretIdx}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    
        fretboardHTML += `</div>`;
    
        const container = document.createElement("div");
        container.innerHTML = fretboardHTML;
        return container;
    }
    async function displayScaleShapes() {
        const { key, mode } = await getCurrentSongKey();
    
        if (key === "Undefined") {
            Spicetify.showNotification("Key is undefined for the current song.");
            return;
        }
    
        const scaleType = `${key} ${mode}`; // Combine key and mode to get the scale type
        const scaleShapes = {
            "C Major": {
                positions: [
                    //{ position: X, root: Y, frets: [[lowE], [A], [D], [G], [B], [highE]] }
                    { position: 1, root: 7, frets: [[8, 10], [8, 10], [7, 9], [7, 10], [7, 10], [8, 10]] },
                    { position: 2, root: 10, frets: [[10, 12], [10, 13], [9, 12], [10, 12], [10, 12], [10, 12]] },
                    { position: 3, root: 15, frets: [[13, 15], [13, 16], [12, 15], [12, 15], [13, 15], [13, 15]] },
       



                ]
            },
            "C♯/D♭ Major": {
                positions: [

                ]
            },
            "D Major": {
                positions: [

                ]
            },
            "D♯/E♭ Major": {
                positions: [

                ]
            },
            "E Major": {
                positions: [

                ]
            },
            "F Major": {
                positions: [

                ]
            },
            "F♯/G♭ Major": {
                positions: [

                ]
            },
            "G Major": {
                positions: [

                ]
            },
            "G♯/A♭ Major": {
                positions: [
   
                ]
            },
            "A Major": {

            },
            "A♯/B♭ Major": {

            },
            "B Major": {

            },
            "C Minor": {
                positions: [

                ]
            },
            "C♯/D♭ Minor": {
                positions: [

                ]
            },
            "D Minor": {
                positions: [

                ]
            },
            "D♯/E♭ Minor": {
                positions: [

                ]
            },
            "E Minor": {
                positions: [

                ]
            },
            "F Minor": {
                positions: [

                ]
            },
            "F♯/G♭ Minor": {
                positions: [

                ]
            },
            "G Minor": {
                positions: [

                ]
            },
            "G♯/A♭ Minor": {
                positions: [

                ]
            },
            "A Minor": {
                positions: [

                ]
            },
            "A♯/B♭ Minor": {
                positions: [

                ]
            },
            "B Minor": {
                positions: [

                ]
            }
            

        };
        if (!scaleShapes[scaleType]) {
            Spicetify.showNotification(`Scale shapes for ${scaleType} are not available.`);
            return;
        }
    
        const scaleHTML = generateScaleHTML({ [scaleType]: scaleShapes[scaleType] });
        const modalContent = document.createElement('div');
        modalContent.appendChild(scaleHTML);
    
        Spicetify.PopupModal.display({
            title: `Scale Shapes for ${scaleType}`,
            content: modalContent.innerHTML,
            isLarge: true, // Ensures the modal is larger
            style: {
                width: "90vw",
                height: "90vh",
                maxWidth: "1200px", 
                maxHeight: "800px", 
            }
        });
    }