// putOptionTrade - Game Engine Logic
const EXCHANGE_RATE = 1400;

// Initial Game State
let gameState = {
    wtiPrice: 100.0,
    timeRemaining: 30, // 30 seconds game loop
    position: 'NONE', // 'NONE', 'BUY', 'SELL'
    premiumPaidOrReceived: 0,
    contracts: 10,
    multiplier: 1000,
    isActive: false,
    timerInterval: null
};

// DOM Elements
const elTimer = document.getElementById("timer-display");
const elPlUsd = document.getElementById("pl-usd");
const elPlKrw = document.getElementById("pl-krw");
const elPosStr = document.getElementById("current-position");
const elWti = document.getElementById("wti-price");
const elMargin = document.getElementById("margin-ratio");
const newsContainer = document.getElementById("news-container");
const deltaVal = document.getElementById("delta-val");
const deltaBar = document.getElementById("delta-bar");
const thetaVal = document.getElementById("theta-val");
const thetaBar = document.getElementById("theta-bar");

const audioHeartbeat = document.getElementById("heartbeat-snd");

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("btn-buy").addEventListener("click", () => enterPosition('BUY'));
    document.getElementById("btn-sell").addEventListener("click", () => enterPosition('SELL'));
    document.getElementById("btn-close-sms").addEventListener("click", () => showReceipt("MARGIN_CALL"));
    document.getElementById("btn-restart").addEventListener("click", resetGame);

    resetGame();
});

function enterPosition(type) {
    if (gameState.position !== 'NONE' || !gameState.isActive) return;

    gameState.position = type;
    gameState.premiumPaidOrReceived = 2.0 * gameState.multiplier * gameState.contracts; // $20,000

    if (type === 'BUY') {
        elPosStr.innerText = "풋옵션 매수 (Buy Put)";
        elPosStr.style.color = "var(--neon-profit)";
    } else {
        elPosStr.innerText = "풋옵션 매도 (Sell Put)";
        elPosStr.style.color = "var(--neon-loss)";
    }

    // Disable buttons
    document.getElementById("btn-buy").disabled = true;
    document.getElementById("btn-sell").disabled = true;

    addNews("System", "안내", `완벽합니다. 포지션을 잡았습니다. 이제 시장의 반응을 지켜봅시다.`);
}

function startGame() {
    gameState.isActive = true;
    gameState.timerInterval = setInterval(gameTick, 1000);
}

function gameTick() {
    if (!gameState.isActive) return;

    gameState.timeRemaining--;
    elTimer.innerText = gameState.timeRemaining;

    // Simulate Time Decay (Theta)
    let timeDecay = ((30 - gameState.timeRemaining) / 30) * 0.15;
    thetaVal.innerText = "-" + timeDecay.toFixed(2);
    thetaBar.style.width = `${Math.min(100, (timeDecay / 0.15) * 100)}%`;

    // Random walk before the big event
    if (gameState.timeRemaining > 10) {
        let noise = (Math.random() - 0.5) * 0.4;
        gameState.wtiPrice += noise;

        if (gameState.timeRemaining === 25) addNews("11:03", "루머", "골프장 이동 포착? 이란 공격은 안할듯", "rumor");
        if (gameState.timeRemaining === 15) addNews("11:05", "속보", "트럼프 공식 기자회견 시작", "urgent");
    }
    // The Big Event! WTI crashes
    else if (gameState.timeRemaining === 10) {
        gameState.wtiPrice -= 15.0; // Huge drop to ~$85
        addNews("11:10", "긴급", "폭격 보류 선명! 국제 유가 패닉 셀링 15% 폭락!!", "urgent");
        deltaVal.innerText = "-0.95";
        deltaBar.style.width = "95%";
    }
    else {
        let noise = (Math.random() - 0.5) * 0.5;
        gameState.wtiPrice += noise;
    }

    elWti.innerText = "$" + gameState.wtiPrice.toFixed(2);

    updatePnL();

    // Check End Game
    if (gameState.timeRemaining <= 0) {
        clearInterval(gameState.timerInterval);
        gameState.isActive = false;
        showReceipt("END");
    }
}

function updatePnL() {
    if (gameState.position === 'NONE') return;

    let intrinsicValue = Math.max(0, 95 - gameState.wtiPrice); // Strike is 95
    let currentPremium = intrinsicValue + 0.5; // simple model
    if (gameState.timeRemaining < 10) currentPremium = intrinsicValue + 0.1; // IV crush / time decay at end

    let marketValue = currentPremium * gameState.multiplier * gameState.contracts;
    let initialValue = gameState.premiumPaidOrReceived; // $20,000

    let pnl = 0;
    if (gameState.position === 'BUY') {
        pnl = marketValue - initialValue;
    } else if (gameState.position === 'SELL') {
        pnl = initialValue - marketValue;
    }

    // Format UI
    elPlUsd.innerText = pnl >= 0 ? "+$" + pnl.toFixed(2) : "-$" + Math.abs(pnl).toFixed(2);
    elPlUsd.className = "value-usd " + (pnl >= 0 ? "profit" : "loss");

    let pnlKrw = pnl * EXCHANGE_RATE;
    let formatter = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
    elPlKrw.innerText = `(약 ${formatter.format(pnlKrw).replace('₩', '')} 원)`;
    elPlKrw.className = "value-krw " + (pnl >= 0 ? "profit" : "loss");

    // Margin Call trigger for Sellers
    if (gameState.position === 'SELL' && pnl < -20000 && gameState.timeRemaining > 0) {
        elMargin.innerText = "0% (마진콜 발생!)";
        elMargin.className = "loss";
        triggerMarginCall();
    }
}

function triggerMarginCall() {
    clearInterval(gameState.timerInterval);
    gameState.isActive = false;

    document.getElementById("margin-call-overlay").classList.remove("hidden");
    document.body.classList.add("danger-pulse-bg");
    audioHeartbeat.volume = 0.5;
    audioHeartbeat.play().catch(e => console.log(e));
}

function showReceipt(reason) {
    document.getElementById("margin-call-overlay").classList.add("hidden");
    document.body.classList.remove("danger-pulse-bg");
    audioHeartbeat.pause(); audioHeartbeat.currentTime = 0;

    const overlay = document.getElementById("game-over-overlay");
    overlay.classList.remove("hidden");

    let titleStr = "[ 투자 결과 영수증 ]";
    let msgStr = "";

    const pnlUsdNum = parseFloat(elPlUsd.innerText.replace(/[^0-9.-]+/g, ""));

    if (gameState.position === 'SELL') {
        titleStr = "📉 [ 파산 영수증 ]";
        msgStr = "AI 팩트폭행: 리스크가 무제한인 '매도' 포지션을 잡고 폭락을 맞았습니다. 탐욕의 끝은 늘 마진콜입니다. 빚쟁이가 되셨습니다.";
        document.getElementById("receipt-title").style.color = "var(--neon-loss)";
    } else if (gameState.position === 'BUY') {
        titleStr = "🏆 [ 워렌버핏 영수증 ]";
        msgStr = "AI 팩트폭행: 내부정보(?)를 활용한 완벽한 풋옵션 매수 타이밍! 시간가치 소멸(세타)을 이겨내고 막대한 수익을 냈습니다.";
        document.getElementById("receipt-title").style.color = "var(--neon-profit)";
    } else {
        msgStr = "AI 팩트폭행: 아무 포지션도 잡지 않아 원금은 지켰습니다만, 기회도 날렸습니다.";
    }

    document.getElementById("receipt-title").innerText = titleStr;
    document.getElementById("receipt-pos").innerText = gameState.position === "NONE" ? "무포지션" : (gameState.position === "BUY" ? "WTI 95 풋 매수" : "WTI 95 풋 매도");
    document.getElementById("receipt-wti").innerText = "$" + gameState.wtiPrice.toFixed(2);

    // Format PnL
    let netUsd = isNaN(pnlUsdNum) ? 0 : pnlUsdNum;
    let netKrw = netUsd * EXCHANGE_RATE;
    let taxUsd = netUsd > 2000 ? (netUsd - 2000) * 0.11 : 0; // 11% cap gains tax on >$2k

    document.getElementById("receipt-pl").innerText = (netUsd >= 0 ? "+$" : "-$") + Math.abs(netUsd).toFixed(2);
    document.getElementById("receipt-pl").className = netUsd >= 0 ? "profit" : "loss";

    document.getElementById("receipt-tax").innerText = "-$" + taxUsd.toFixed(2);
    document.getElementById("receipt-msg").innerText = msgStr;
}

function addNews(time, tag, text, cssClass = "normal") {
    const el = document.createElement("div");
    el.className = `news-item ${cssClass}`;
    el.innerHTML = `<span class="time">${time}</span><span class="tag">${tag}</span><p>${text}</p>`;
    newsContainer.prepend(el);
}

function resetGame() {
    clearInterval(gameState.timerInterval);
    gameState = { wtiPrice: 100.0, timeRemaining: 30, position: 'NONE', premiumPaidOrReceived: 0, contracts: 10, multiplier: 1000, isActive: false, timerInterval: null };

    elTimer.innerText = "30";
    elWti.innerText = "$100.00";
    elPlUsd.innerText = "$0.00";
    elPlUsd.className = "value-usd";
    elPlKrw.innerText = "(약 0 원)";
    elPlKrw.className = "value-krw";
    elPosStr.innerText = "포지션 없음 (무포)";
    elPosStr.style.color = "var(--neon-info)";
    elMargin.innerText = "100% (안전)";
    elMargin.className = "";

    document.getElementById("btn-buy").disabled = false;
    document.getElementById("btn-sell").disabled = false;
    document.getElementById("game-over-overlay").classList.add("hidden");
    newsContainer.innerHTML = '';

    thetaVal.innerText = "-0.00"; thetaBar.style.width = "0%";
    deltaVal.innerText = "-0.45"; deltaBar.style.width = "45%";

    addNews("System", "안내", "곧 트럼프 전 대통령의 이란 폭격 관련 중대 발표가 있습니다. 포지션을 선택하세요!");

    startGame();
}
