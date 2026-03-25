// Core Logic for the Prototype
const EXCHANGE_RATE = 1400; // 1 USD = 1,400 KRW

document.addEventListener("DOMContentLoaded", () => {

    const marginCallOverlay = document.getElementById("margin-call-overlay");
    const btnTestMarginCall = document.getElementById("test-margin-call");
    const btnCloseSms = document.getElementById("btn-close-sms");
    const heartbeatAudio = document.getElementById("heartbeat-snd");

    // Dynamic KRW formatting based on USD text
    function updateKRWDisplay() {
        const usdElem = document.getElementById("pl-usd");
        const krwElem = document.getElementById("pl-krw");

        // Extract numeric value from text like "-$20,000.00"
        let rawStr = usdElem.innerText.replace(/[^0-9.-]+/g, "");
        let usdValue = parseFloat(rawStr);

        let krwValue = usdValue * EXCHANGE_RATE;

        // Format to local string with won
        let formatter = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
        krwElem.innerText = `(약 ${formatter.format(krwValue).replace('₩', '')} 원)`;
    }

    // Trigger Margin Call Pulse & Overlay
    btnTestMarginCall.addEventListener("click", () => {
        // Show SMS Overlay
        marginCallOverlay.classList.remove("hidden");

        // Add danger pulse to the whole document body
        document.body.classList.add("danger-pulse-bg");

        // Play heartbeat sound to induce anxiety
        heartbeatAudio.volume = 0.5;
        heartbeatAudio.play().catch(e => console.log('Audio autoplay prevented by browser.'));
    });

    // Close Margin Call Overlay
    btnCloseSms.addEventListener("click", () => {
        marginCallOverlay.classList.add("hidden");
        document.body.classList.remove("danger-pulse-bg");

        // Pause audio
        heartbeatAudio.pause();
        heartbeatAudio.currentTime = 0;
    });

    // Initialize formatting
    updateKRWDisplay();
});
