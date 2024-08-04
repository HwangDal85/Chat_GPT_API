// DOM 요소를 선택합니다.
const $form = document.querySelector("#orchestraForm");
const $instrumentInput = document.querySelector("#instrument");
const $compositionTypeSelect = document.querySelector("#compositionType");
const $sizeContainer = document.querySelector("#sizeContainer");
const $sizeSelect = document.querySelector("#size");
const $difficultySelect = document.querySelector("#difficulty");
const $preferredComposerInput = document.querySelector("#preferredComposer");
const $recommendationList = document.querySelector("#recommendationList");
const $loadingBox = document.querySelector("#loadingBox");
const $questionBox = document.querySelector("#questionBox");
const $userQuestion = document.querySelector("#userQuestion");

// OpenAI API의 URL을 설정합니다.
const url = `https://open-api.jejucodingcamp.workers.dev/`;

// 질문과 답변을 저장할 배열을 초기화합니다.
let data = [
    {
        role: "system",
        content: "당신은 클래식 음악과 오케스트라에 대해 해박한 지식을 가진 전문가입니다.",
    },
];

/**
 * 곡의 형식에 따라 오케스트라 규모 선택 옵션을 표시하거나 숨깁니다.
 * 교향곡, 관현악곡, 협주곡의 경우에만 규모 선택 옵션을 표시합니다.
 */
$compositionTypeSelect.addEventListener("change", (e) => {
    const selectedType = e.target.value;
    if (["교향곡"].includes(selectedType)) {
        $sizeContainer.style.display = "block";
        $sizeSelect.required = true;
    } else {
        $sizeContainer.style.display = "none";
        $sizeSelect.required = false;
    }
});

/**
 * 폼 제출 이벤트를 처리합니다.
 * 사용자 입력을 바탕으로 API에 요청을 보내고, 결과를 화면에 표시합니다.
 */
$form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 이전 결과를 지우고 로딩 박스를 표시합니다.
    $recommendationList.innerHTML = "";
    $loadingBox.style.display = "block";

    // 사용자 입력값을 가져옵니다.
    const instrument = $instrumentInput.value.trim();
    const compositionType = $compositionTypeSelect.value;
    const size = $sizeSelect.value;
    const difficulty = $difficultySelect.value;
    const preferredComposer = $preferredComposerInput.value.trim();

    // 사용자의 질문을 구성합니다.
    let question = `주요 악기가 ${instrument}이고, ${compositionType} 형식이며, ${difficulty} 난이도인 작곡가와 곡을 5개 추천해주세요.`;

    if (["교향곡", "관현악곡", "협주곡"].includes(compositionType)) {
        question += ` 또한, ${size} 규모의 오케스트라에 적합한 곡들을 추천해주세요.`;
    }

    if (preferredComposer) {
        question += ` 가능하다면 ${preferredComposer}의 작품을 포함해주세요.`;
    }

    question += ` 각 추천에 대해 곡명, 작곡가, 간단한 설명을 포함해주세요. 작곡가와 곡명은 영어 원문으로 작성해주세요.
    응답 형식은 다음과 같이 해주세요: 

    곡명: [곡명]
    작곡가: [작곡가 이름]
    설명: [2~3 문장의 간단한 설명]
    
    곡명: [곡명]
    작곡가: [작곡가 이름]
    ...`;

    // 질문을 데이터 배열에 추가합니다.
    data.push({
        role: "user",
        content: question,
    });

    // 사용자 질문을 표시합니다.
    $userQuestion.textContent = `찾는 악기 : ${instrument} / 곡의 형식 : ${compositionType} / 곡의 난이도 : ${difficulty}`;
    if (preferredComposer) {
            $userQuestion.textContent = `찾는 악기 : ${instrument} / 곡의 형식 : ${compositionType} / 곡의 난이도 : ${difficulty} / 선호 작곡가 : ${preferredComposer}`;
    }
    $questionBox.style.display = "block";

    try {
        // API에 요청을 보냅니다.
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            redirect: "follow",
        });

        // API 응답을 JSON으로 파싱합니다.
        const result = await response.json();

        // API 응답을 안전하게 처리합니다.
        if (result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
            const answer = result.choices[0].message.content;

            // 로딩 박스를 숨기고 결과를 표시합니다.
            $loadingBox.style.display = "none";
            displayRecommendations(answer);
        } else {
            throw new Error("API 응답 형식이 올바르지 않습니다.");
        }
    } catch (err) {
        // 에러를 콘솔에 출력하고 사용자에게 알립니다.
        console.error("Error:", err);
        alert("추천을 가져오는 데 문제가 발생했습니다. 다시 시도해주세요.");
        // 에러 발생 시에도 로딩 박스를 숨깁니다.
        $loadingBox.style.display = "none";
    }

    // 폼을 초기화하고 규모 선택 옵션을 숨깁니다.
    $form.reset();
    $sizeContainer.style.display = "none";
});

/**
 * API 응답을 파싱하여 추천 목록을 화면에 표시합니다.
 * @param {string} answer - API 응답 텍스트
 */
function displayRecommendations(answer) {
    $recommendationList.innerHTML = "";
    const recommendations = answer.split("\n\n");

    recommendations.forEach((recommendation) => {
        const lines = recommendation.split("\n");
        if (lines.length >= 3) {
            const composer = lines[1].replace("작곡가: ", "").trim();
            const piece = lines[0].replace("곡명: ", "").trim();
            const description = lines[2].replace("설명: ", "").trim();

            // 추천 항목을 생성합니다.
            const li = document.createElement("li");
            
            const pieceElement = document.createElement("div");
            pieceElement.className = "piece";
            pieceElement.textContent = piece;

            const composerElement = document.createElement("div");
            composerElement.className = "composer";
            composerElement.textContent = composer;
            
            const descriptionElement = document.createElement("div");
            descriptionElement.className = "description";
            descriptionElement.textContent = description;
            
            const youtubeLink = document.createElement("a");
            youtubeLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${composer} ${piece}`)}`;
            youtubeLink.className = "youtube-link";
            youtubeLink.textContent = "YouTube에서 검색";
            youtubeLink.target = "_blank";

            // 추천 항목을 리스트에 추가합니다.
            li.appendChild(pieceElement);
            li.appendChild(composerElement);
            li.appendChild(descriptionElement);
            li.appendChild(youtubeLink);

            $recommendationList.appendChild(li);
        }
    });
}

// 스크롤 이벤트를 처리하여 헤더의 투명도를 조정합니다.
document.addEventListener("scroll", function() {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) { // 스크롤 위치가 50px 이상이면
        header.classList.add("transparent");
    } else {
        header.classList.remove("transparent");
    }
});
