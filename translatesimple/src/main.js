const inputTextArea   = document.getElementById('translateInput');
const outputTextArea  = document.getElementById('translateOutput');
const translateButton = document.getElementById('translateButton');
translateButton.onclick = translateButtonClicked;

const LANG_POOL = ['ja', 'sw', 'fi', 'ar', 'ko', 'th', 'hi', 'tr', 'el', 'he', 'vi', 'ms', 'af', 'eu', 'gl'];

const mistranslateDefaults = {
    languages:          5,
    splitPercent:       40,
    leaveChance:        50,
    continuous:         false,
    continuousDelay:    1000,
    continuousMaxLoops: 3,
    translatingMessage: 'translating…'
};

mistranslateSettings = { ...mistranslateDefaults, ...(typeof mistranslateSettings !== 'undefined' ? mistranslateSettings : {}) };


let continuousInterval = null;
let resultHistory      = [];
let cycleIndex         = 0;
let isTranslating      = false;



async function translateButtonClicked() {
    if (continuousInterval) {
        clearInterval(continuousInterval);
        continuousInterval = null;
    }
    resultHistory  = [];
    cycleIndex     = 0;
    isTranslating  = false;

    if (mistranslateSettings.continuous) {
        await runAndStore(inputTextArea.value, true);

        continuousInterval = setInterval(async () => {
            const maxLoops = mistranslateSettings.continuousMaxLoops;

            if (resultHistory.length >= maxLoops) {
                sendTextOut(resultHistory[cycleIndex % maxLoops]);
                cycleIndex++;
            } else if (!isTranslating) {
                await runAndStore(inputTextArea.value, false);
                console.log(`result history (${resultHistory.length}/${maxLoops}):`, resultHistory);
            }
        }, mistranslateSettings.continuousDelay);
    } else {
        const result = await mistranslate(inputTextArea.value, true);
        sendTextOut(result);
    }
}



async function runAndStore(text, showLoadingMessage) {
    isTranslating = true;
    const result  = await mistranslate(text, showLoadingMessage);
    isTranslating = false;
    resultHistory.push(result);
    sendTextOut(result);
}



async function mistranslate(text, showLoadingMessage) {
    if (showLoadingMessage) {
        sendTextOut(mistranslateSettings.translatingMessage);
    }

    const textChunks = splitText(text, mistranslateSettings.splitPercent);
    const langChains = textChunks.map(() =>
        selectLanguages(mistranslateSettings.languages, LANG_POOL)
    );

    console.log('chunks:', textChunks);
    console.log('lang chains:', langChains);

    const translatedChunks = await Promise.all(
        textChunks.map((chunk, i) => translateChunk(chunk, langChains[i]))
    );

    return translatedChunks.join(' ');
}



async function translateChunk(chunk, langChain) {
    const stagesTotal   = langChain.length;
    const leavePerStage = mistranslateSettings.leaveChance / stagesTotal;

    let currentText = chunk;
    let prevLang    = 'auto';

    for (let i = 0; i < langChain.length; i++) {
        const targetLang = langChain[i];
        currentText = await translateText(currentText, targetLang, prevLang);
        prevLang = targetLang;

        if (Math.random() * 100 < leavePerStage) {
            console.log(`chunk left at stage ${i + 1} (${targetLang}):`, currentText);
            return currentText;
        }
    }

    currentText = await translateText(currentText, 'en', prevLang);
    return currentText;
}



function sendTextOut(text) {
    outputTextArea.value = text;
}

function selectLanguages(num, langPool) {
    const langs = [];
    for (let i = 0; i < num; i++) {
        langs.push(langPool[Math.floor(Math.random() * langPool.length)]);
    }
    return langs;
}

function splitText(text, splitPercent) {
    const words = text.trim().split(/\s+/);
    if (words.length <= 1) return [text];

    const chunks  = [];
    let   current = [];

    for (let i = 0; i < words.length; i++) {
        current.push(words[i]);
        const isLast = i === words.length - 1;
        if (!isLast && Math.random() < splitPercent / 100) {
            chunks.push(current.join(' '));
            current = [];
        }
    }
    if (current.length > 0) chunks.push(current.join(' '));

    return chunks;
}



async function translateText(text, to, from = 'auto') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  const data = await res.json();
  // response is a nested array — join all translated chunks
  return data[0].map(chunk => chunk[0]).join('');
}