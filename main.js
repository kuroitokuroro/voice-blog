
const TAB_STORAGE_KEY = "koeTabOrder";
const DIARY_STORAGE_KEY = "voiceDiaryData";
const GOAL_STORAGE_KEY = "koeGoalData";
const HABIT_STORAGE_KEY = "koeHabitData";
const SCHEDULE_STORAGE_KEY = "koeScheduleData";
const DATE_SWITCH_MODE_KEY = "dateSwitchMode";
const DATE_SWITCH_HOUR_KEY = "dateSwitchHour";
const SKIN_STORAGE_KEY = "koeSkin";
const DEFAULT_SKIN = "skin-light-mono";


const DEFAULT_TABS = [
  {
    id: "diary",
    label: "日記",
    panelId: "diaryPanel",
    icon: "menu_book",
  },
  {
    id: "goal",
    label: "目標",
    panelId: "goalPanel",
    icon: "target",
  },
  {
    id: "habit",
    label: "習慣",
    panelId: "habitPanel",
    icon: "check_box",
  },
  {
    id: "schedule",
    label: "予定",
    panelId: "schedulePanel",
    icon: "calendar_today",
  },
];

const VALID_SKINS = [
  "skin-light-mono",
  "skin-light-red",
  "skin-light-blue",
  "skin-light-yellow",
  "skin-light-green",
  "skin-light-purple",
  "skin-dark-mono",
  "skin-dark-red",
  "skin-dark-blue",
  "skin-dark-yellow",
  "skin-dark-green",
  "skin-dark-purple",
];

const skinButtons = document.querySelectorAll("[data-skin]");
const tabBar = document.getElementById("tabBar");
const voiceButton = document.getElementById("voiceButton");
const downloadButton = document.getElementById("downloadButton");
const todayDiaryList = document.getElementById("todayDiaryList");
const dateButtons = document.getElementById("dateButtons");
const pastDiaryList = document.getElementById("pastDiaryList");
const monthSelect = document.getElementById("monthSelect");
const goalVoiceButton = document.getElementById("goalVoiceButton");
const goalMultiDeleteButton = document.getElementById("goalMultiDeleteButton",);
const goalList = document.getElementById("goalList");
const goalSortButton = document.getElementById("goalSortButton");
const deleteOldestMonthButton = document.getElementById("deleteOldestMonthButton",);
const habitAddArea = document.getElementById("habitAddArea");
const habitInput = document.getElementById("habitInput");
const habitAddSubmitButton = document.getElementById("habitAddSubmitButton",);
const habitList = document.getElementById("habitList");
const habitCalendar = document.getElementById("habitCalendar");
const helpButton = document.getElementById("helpButton",);
const settingsButton = document.getElementById("settingsButton");
const pastDiaryCalendar = document.getElementById("pastDiaryCalendar");
const scheduleInput = document.getElementById("scheduleInput");
const scheduleAddButton = document.getElementById("scheduleAddButton");
const scheduleList = document.getElementById("scheduleList");
const scheduleDangerArea = document.getElementById("scheduleDangerArea");
const scheduleVoiceButton = document.getElementById("scheduleVoiceButton");
const diaryInput = document.getElementById("diaryInput");
const diaryAddButton = document.getElementById("diaryAddButton");
const goalInput = document.getElementById("goalInput");
const goalAddButton = document.getElementById("goalAddButton");
const goalColorButton = document.getElementById("goalColorButton");
const fixedRadio = document.getElementById("dateSwitchFixed");
const customRadio = document.getElementById("dateSwitchCustom");
const customArea = document.getElementById("dateSwitchCustomArea");
const exportBackupButton = document.getElementById("exportBackupButton");
const importBackupInput = document.getElementById("importBackupInput");

let tabOrder = loadTabOrder();
let activeTabId = tabOrder[0].id;
let lastMainTabId = activeTabId;
let selectedPastDateKey = null;
let selectedHabitIndex = null;
let isGoalDeleteMode = false;
let editingHabitIndex = null;
let draggingTabId = null;
let isGoalSortMode = false;
let isDiaryListening = false;
let isGoalListening = false;
let habitCalendarMonthOffset = 0;
let pastDiaryCalendarMonthOffset = 0;
let isPastDiaryCalendarOpen = false;
let isScheduleDoneDeleteMode = false;
let isScheduleListening = false;
let isGoalColorMode = false;

const today = getLogicalToday();
const todayKey = formatDateKey(today);

setupDiaryVoiceInput();
setupGoalVoiceInput();
setupScheduleVoiceInput();
setupDateSwitchRange();
downloadButton.addEventListener("click", downloadTxt);
deleteOldestMonthButton.addEventListener("click", deleteOldestMonthDiary);
goalMultiDeleteButton.addEventListener("click", toggleGoalMultiDelete);
goalSortButton.addEventListener("click", toggleGoalSortMode);
habitAddSubmitButton.addEventListener("click", addHabitFromInput);
habitInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addHabitFromInput();
});
helpButton.addEventListener("click", openHelp);
settingsButton.addEventListener("click", openSettings);
scheduleAddButton.addEventListener("click", addScheduleFromInput);
diaryAddButton.addEventListener("click", addDiaryFromInput);
goalAddButton.addEventListener("click", addGoalFromInput);
goalColorButton.addEventListener("click", toggleGoalColorMode);
exportBackupButton.addEventListener("click", exportBackup);
importBackupInput.addEventListener("change", importBackup);

skinButtons.forEach((skinButton) => {
  skinButton.addEventListener("click", () => {
    changeSkin(skinButton.dataset.skin);
    updateSelectedSkinButton(skinButton.dataset.skin);
  });
});

const currentSkin = loadSkin();

applySkin(currentSkin);
updateSelectedSkinButton(currentSkin);

renderTabs();
renderPanels();
renderTodayDiary();
renderPastDateButtons();
renderPastDiaryCalendar();
renderMonthSelect();
renderGoalList();
renderHabitList();
renderScheduleList();

function updateSelectedSkinButton(currentSkin) {
  skinButtons.forEach((skinButton) => {
    const isSelected = skinButton.dataset.skin === currentSkin;

    skinButton.classList.toggle("selected", isSelected);
    skinButton.setAttribute("aria-pressed", isSelected);
  });
}

function setupDiaryVoiceInput() {

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceButton.textContent = "このブラウザは音声入力に未対応です";
    voiceButton.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.continuous = false;

  voiceButton.addEventListener("click", () => {
    if (isDiaryListening) return;

    isDiaryListening = true;
    voiceButton.classList.add("listening");
    voiceButton.disabled = true;

    recognition.start();
  });

  recognition.onresult = (event) => {
    const result = event.results[event.resultIndex];

    if (!result.isFinal) return;

    const text = normalizeVoiceText(result[0].transcript);
    const items = formatDiary(text);

    items.forEach((item) => saveDiaryItem(todayKey, item));

    renderTodayDiary();
    renderPastDateButtons();
    renderMonthSelect();
  };

  recognition.onend = () => {
    isDiaryListening = false;
    voiceButton.classList.remove("listening");
    voiceButton.disabled = false;
  };

  recognition.onerror = () => {
    isDiaryListening = false;
    voiceButton.classList.remove("listening");
    voiceButton.disabled = false;
    alert("音声入力でエラーが発生しました。");
  };
}

function setupGoalVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    goalVoiceButton.textContent = "このブラウザは音声入力に未対応です";
    goalVoiceButton.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.continuous = false;

  goalVoiceButton.addEventListener("click", () => {
    if (isGoalListening) return;

    isGoalListening = true;

    goalVoiceButton.classList.add("listening");
    goalVoiceButton.disabled = true;

    recognition.start();
  });

  recognition.onresult = (event) => {
    const text = normalizeVoiceText(event.results[0][0].transcript);
    const items = formatDiary(text);

    items.forEach((item) => saveGoalItem(item));
    renderGoalList();
  };

  recognition.onend = () => {
    isGoalListening = false;

    goalVoiceButton.classList.remove("listening");
    goalVoiceButton.disabled = false;
  };

  recognition.onerror = () => {
    isGoalListening = false;

    goalVoiceButton.classList.remove("listening");
    goalVoiceButton.disabled = false;

    alert("音声入力でエラーが発生しました。");
  };
}

function setupScheduleVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    scheduleVoiceButton.textContent = "このブラウザは音声入力に未対応です";
    scheduleVoiceButton.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.continuous = false;

  scheduleVoiceButton.addEventListener("click", () => {
    if (isScheduleListening) return;

    isScheduleListening = true;
    scheduleVoiceButton.classList.add("listening");
    scheduleVoiceButton.disabled = true;

    recognition.start();
  });

  recognition.onresult = (event) => {
    const text = normalizeVoiceText(event.results[0][0].transcript);

    saveScheduleItem(text);

    renderScheduleList();
  };

  recognition.onend = () => {
    isScheduleListening = false;
    scheduleVoiceButton.classList.remove("listening");
    scheduleVoiceButton.disabled = false;
  };

  recognition.onerror = () => {
    isScheduleListening = false;
    scheduleVoiceButton.classList.remove("listening");
    scheduleVoiceButton.disabled = false;

    alert("音声入力でエラーが発生しました。");
  };
}

function loadTabOrder() {
  const saved = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY));
  if (!saved) return DEFAULT_TABS;

  const restored = saved
    .map((savedId) => DEFAULT_TABS.find((tab) => tab.id === savedId))
    .filter(Boolean);

  return restored.length === DEFAULT_TABS.length
    ? restored
    : DEFAULT_TABS;
}

function saveTabOrder() {
  const ids = tabOrder.map((tab) => tab.id);
  localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(ids));
}

function renderTabs() {
  tabBar.innerHTML = "";

  tabOrder.forEach((tab, index) => {
    const button = document.createElement("button");
    button.className = "tab-button";
    button.type = "button";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined tab-icon";
    icon.textContent = tab.icon;

    const label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = tab.label;

    button.appendChild(icon);
    button.appendChild(label);

    if (tab.id === activeTabId) button.classList.add("active");

    if (tab.id === draggingTabId) button.classList.add("dragging");

    setupTabDrag(button, index);
    tabBar.appendChild(button);
  });
}

function renderPanels() {
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.remove("active");
  });

  const activeTab = DEFAULT_TABS.find((tab) => tab.id === activeTabId);

  if (activeTab) {
    document.getElementById(activeTab.panelId).classList.add("active");
    return;
  }

  if (activeTabId === "help") {
    document.getElementById("helpPanel").classList.add("active");
    return;
  }

  if (activeTabId === "settings") {
    document.getElementById("settingsPanel").classList.add("active");
  }
}

function setupTabDrag(button, startIndex) {
  let startX = 0;
  let offsetX = 0;
  let currentIndex = startIndex;
  let isDragging = false;
  let hasMoved = false;
  let ghost = null;

  function onPointerMove(event) {
    if (!isDragging || !ghost) return;

    const diff = event.clientX - startX;
    const tabWidth = ghost.getBoundingClientRect().width;
    const moveThreshold = tabWidth * 0.9;

    if (Math.abs(diff) > 10) {
      hasMoved = true;
    }

    ghost.style.left = `${event.clientX - offsetX}px`;

    if (diff > moveThreshold && currentIndex < tabOrder.length - 1) {
      swapTabs(currentIndex, currentIndex + 1);
      currentIndex += 1;
      startX = event.clientX;
      draggingTabId = tabOrder[currentIndex].id;
      return;
    }

    if (diff < -moveThreshold && currentIndex > 0) {
      swapTabs(currentIndex, currentIndex - 1);
      currentIndex -= 1;
      startX = event.clientX;
      draggingTabId = tabOrder[currentIndex].id;
    }
  }

  function onPointerUp() {
    isDragging = false;

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);

    if (ghost) {
      ghost.remove();
      ghost = null;
    }

    if (!hasMoved) {
      closeSwipeActions();
      isScheduleDoneDeleteMode = false;

      activeTabId = tabOrder[currentIndex].id;
      lastMainTabId = activeTabId;

      renderTabs();
      renderPanels();

      if (activeTabId === "schedule") {
        renderScheduleList();
      }

      return;
    }

    draggingTabId = null;
    renderTabs();
  }

  button.addEventListener("pointerdown", (event) => {
    const rect = button.getBoundingClientRect();

    startX = event.clientX;
    offsetX = event.clientX - rect.left;
    currentIndex = startIndex;
    isDragging = true;
    hasMoved = false;

    ghost = button.cloneNode(true);
    ghost.classList.add("tab-drag-ghost");
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;

    document.body.appendChild(ghost);

    draggingTabId = tabOrder[startIndex].id;
    renderTabs();

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  });
}

function swapTabs(fromIndex, toIndex) {
  const temp = tabOrder[fromIndex];
  tabOrder[fromIndex] = tabOrder[toIndex];
  tabOrder[toIndex] = temp;

  saveTabOrder();
  renderTabs();
}

function isPcPointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function finishEditingItems() {
  document.querySelectorAll(".text.editing").forEach((content) => {
    const item = content.closest(".common-item");
    const editButton = item?.querySelector(".edit-button");

    if (editButton) {
      editButton.click();
    }
  });
}

function closeSwipeActions(exceptItem = null) {
  document
    .querySelectorAll(".show-delete, .show-edit, .show-actions")
    .forEach((item) => {
      if (item === exceptItem) return;

      item.classList.remove("show-delete");
      item.classList.remove("show-edit");
      item.classList.remove("show-actions");
    });
}

function setupPcActionMenu(item, target, options = {}) {
  target.addEventListener("click", (event) => {
    if (!isPcPointer()) return;
    if (options.shouldBlock && options.shouldBlock()) return;

    event.stopPropagation();

    const willOpen = !item.classList.contains("show-actions");

    closeSwipeActions(item);

    item.classList.remove("show-edit");
    item.classList.remove("show-delete");
    item.classList.toggle("show-actions", willOpen);
  });
}

function setupSwipeActions(item, options = {}) {
  let startX = 0;
  let startState = "default";

  item.addEventListener("touchstart", (event) => {
    if (options.shouldBlock && options.shouldBlock()) return;

    closeSwipeActions(item);
    startX = event.touches[0].clientX;

    if (item.classList.contains("show-delete")) {
      startState = "delete";
      return;
    }

    if (item.classList.contains("show-edit")) {
      startState = "edit";
      return;
    }

    startState = "default";
  });

  item.addEventListener("touchmove", (event) => {
    if (options.shouldBlock && options.shouldBlock()) return;

    const currentX = event.touches[0].clientX;
    const diff = startX - currentX;

    if (startState === "default") {
      if (diff > 40) {
        item.classList.add("show-delete"); item.classList.remove("show-edit");
      }

      if (diff < -40) {
        item.classList.add("show-edit"); item.classList.remove("show-delete");
      }
      return;
    }

    if (startState === "delete") {
      if (diff < -30) item.classList.remove("show-delete");
      return;
    }

    if (startState === "edit") {
      if (diff > 30) item.classList.remove("show-edit");
    }
  });
}

document.addEventListener("touchstart", (event) => {
  if (event.target.closest(".common-item")) return;

  closeSwipeActions();
});

document.addEventListener(
  "click",
  (event) => {
    if (!isPcPointer()) return;

    const editingContent =
      document.querySelector(".text.editing");

    if (!editingContent) return;

    const editingItem =
      editingContent.closest(".common-item");

    const clickedItem =
      event.target.closest(".common-item");

    // 編集中のタスク内をクリックした場合は閉じない
    if (clickedItem === editingItem) return;

    // 別のタスクなら、今回は編集終了だけ行う
    if (clickedItem) {
      event.preventDefault();
      event.stopPropagation();
    }

    finishEditingItems();
    closeSwipeActions();
  },
  true,
);

const VOICE_TEXT_REPLACE_RULES = [
  { from: /話しした/g, to: "話した" }
];

function normalizeVoiceText(text) {
  return VOICE_TEXT_REPLACE_RULES.reduce((currentText, rule) => {
    return currentText.replace(rule.from, rule.to);
  }, text);
}

// ===== スキン =====

function isValidSkinName(skinName) {
  return VALID_SKINS.includes(skinName);
}

function loadSkin() {
  const savedSkin = localStorage.getItem(SKIN_STORAGE_KEY);

  if (isValidSkinName(savedSkin)) {
    return savedSkin;
  }

  return DEFAULT_SKIN;
}

function applySkin(skinName) {
  const skinToApply = isValidSkinName(skinName)
    ? skinName
    : DEFAULT_SKIN;

  document.body.classList.remove(...VALID_SKINS);
  document.body.classList.add(skinToApply);
}

function changeSkin(skinName) {
  if (!isValidSkinName(skinName)) {
    return false;
  }

  applySkin(skinName);

  localStorage.setItem(SKIN_STORAGE_KEY, skinName);

  return true;
}

// ===== /スキン =====

function formatDiary(text) {
  return text.split(/[。！？、,]/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function renderTodayDiary() {
  const data = getDiaryData();
  const items = data[todayKey] || [];
  todayDiaryList.innerHTML = "";

  items.forEach((text, index) => addTodayDiaryItem(text, index));
}

function addTodayDiaryItem(text, index) {
  const item = document.createElement("div");
  item.className = "common-item";

  const swipeContent = document.createElement("div");
  swipeContent.className = "swipe-content";

  const content = document.createElement("div");
  content.className = "text";
  content.textContent = text;
  swipeContent.appendChild(content);

  const editButton = document.createElement("div");
  editButton.className = "edit-button";
  editButton.innerHTML = `<span class="material-symbols-outlined">edit</span>`;

  const deleteButton = document.createElement("div");
  deleteButton.className = "delete-button";
  deleteButton.innerHTML = `<span class="material-symbols-outlined">delete</span>`;

  let isEditing = false;

  setupPcActionMenu(item, swipeContent, {
    shouldBlock: () => isEditing,
  });

  editButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!isEditing) {
      isEditing = true;

      item.classList.remove("show-actions");
      item.classList.add("show-edit");

      content.contentEditable = "true";
      content.classList.add("editing");
      content.focus();
      return;
    }

    isEditing = false;
    content.contentEditable = "false";
    content.classList.remove("editing");

    updateDiaryItem(todayKey, index, content.textContent.trim());

    item.classList.remove("show-edit");

    renderTodayDiary();
    renderMonthSelect();
  });

  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteDiaryItemByIndex(todayKey, index);

    renderTodayDiary();
    renderPastDateButtons();
    renderMonthSelect();
  });

  item.appendChild(editButton);
  item.appendChild(deleteButton);
  item.appendChild(swipeContent);
  todayDiaryList.appendChild(item);
  setupSwipeActions(item);
}

function renderPastDateButtons() {
  const data = getDiaryData();
  dateButtons.innerHTML = "";

  const pastKeys = Object.keys(data)
    .sort()
    .reverse()
    .filter((dateKey) => dateKey !== todayKey)
    .slice(0, 5);

  pastKeys.forEach((dateKey) => {
    const date = new Date(dateKey);
    const button = document.createElement("button");
    button.className = "date-button";
    button.textContent = `${date.getMonth() + 1}/${date.getDate()}`;

    if (selectedPastDateKey === dateKey) button.classList.add("active");

    button.addEventListener("click", () => {
      if (selectedPastDateKey === dateKey) {
        selectedPastDateKey = null;
        pastDiaryList.classList.remove("open");
        pastDiaryList.innerHTML = "";
      } else {
        selectedPastDateKey = dateKey;
        isPastDiaryCalendarOpen = false;
        renderPastDiary(dateKey);
      }

      renderPastDateButtons();
      renderPastDiaryCalendar();
    });

    dateButtons.appendChild(button);
  });

  const moreButton = document.createElement("button");
  moreButton.type = "button";
  moreButton.className = "date-button";
  moreButton.textContent = "もっと過去の日記";

  if (isPastDiaryCalendarOpen) {
    moreButton.classList.add("active");
  }

  moreButton.addEventListener("click", () => {
    isPastDiaryCalendarOpen = !isPastDiaryCalendarOpen;

    if (isPastDiaryCalendarOpen) {
      selectedPastDateKey = null;
      pastDiaryList.classList.remove("open");
      pastDiaryList.innerHTML = "";
    }

    renderPastDateButtons();
    renderPastDiaryCalendar();
  });

  dateButtons.appendChild(moreButton);
}

function renderPastDiary(dateKey) {
  const data = getDiaryData();
  const items = data[dateKey] || [];

  pastDiaryList.innerHTML = "";
  pastDiaryList.classList.add("open");

  items.forEach((text, index) => {
    addPastDiaryItem(dateKey, text, index);
  });
}

function addPastDiaryItem(dateKey, text, index) {
  const item = document.createElement("div");
  item.className = "common-item";

  const swipeContent = document.createElement("div");
  swipeContent.className = "swipe-content";

  const content = document.createElement("div");
  content.className = "text";
  content.textContent = text;
  swipeContent.appendChild(content);

  const editButton = document.createElement("div");
  editButton.className = "edit-button";
  editButton.innerHTML = `<span class="material-symbols-outlined">edit</span>`;

  const deleteButton = document.createElement("div");
  deleteButton.className = "delete-button";
  deleteButton.innerHTML = `<span class="material-symbols-outlined">delete</span>`;

  let isEditing = false;

  setupPcActionMenu(item, swipeContent, {
    shouldBlock: () =>
      isEditing ||
      isGoalDeleteMode ||
      isGoalSortMode ||
      isGoalColorMode,
  });

  editButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!isEditing) {
      isEditing = true;

      item.classList.remove("show-actions");
      item.classList.add("show-edit");

      content.contentEditable = "true";
      content.classList.add("editing");
      content.focus();
      return;
    }

    isEditing = false;
    content.contentEditable = "false";
    content.classList.remove("editing");

    updateDiaryItem(dateKey, index, content.textContent.trim());

    item.classList.remove("show-edit");
    renderPastDiary(dateKey);
    renderMonthSelect();
  });

  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();

    deleteDiaryItemByIndex(dateKey, index);

    const data = getDiaryData();

    if (data[dateKey]) {
      renderPastDiary(dateKey);
    } else {
      selectedPastDateKey = null;
      pastDiaryList.classList.remove("open");
      pastDiaryList.innerHTML = "";
    }

    renderPastDateButtons();
    renderMonthSelect();
  });

  item.appendChild(editButton);
  item.appendChild(deleteButton);
  item.appendChild(swipeContent);
  pastDiaryList.appendChild(item);
  setupSwipeActions(item);

}

function getDiaryData() {
  return JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY)) || {};
}

function setDiaryData(data) {
  localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(data));
}

function saveDiaryItem(dateKey, text) {
  const data = getDiaryData();

  if (!data[dateKey]) data[dateKey] = [];

  data[dateKey].push(text);
  setDiaryData(data);
}

function updateDiaryItem(dateKey, index, newText) {
  const data = getDiaryData();

  if (!data[dateKey]) return;
  if (!newText) return;

  data[dateKey][index] = newText;
  setDiaryData(data);
}

function deleteDiaryItemByIndex(dateKey, index) {
  const data = getDiaryData();

  if (!data[dateKey]) return;

  data[dateKey].splice(index, 1);

  if (data[dateKey].length === 0) delete data[dateKey];

  setDiaryData(data);
}

function renderMonthSelect() {
  const data = getDiaryData();

  const months = [
    ...new Set(
      Object.keys(data)
        .sort()
        .map((dateKey) => {
          const date = new Date(dateKey);
          return `${date.getFullYear()}/${date.getMonth() + 1}`;
        }),
    ),
  ];

  monthSelect.innerHTML = "";

  months.forEach((monthKey) => {
    const option = document.createElement("option");
    option.value = monthKey;
    option.textContent = monthKey;
    monthSelect.appendChild(option);
  });
}

function downloadTxt() {
  const data = getDiaryData();
  const selectedMonth = monthSelect.value;

  if (!selectedMonth) {
    alert("ダウンロードする月の日記がありません。");
    return;
  }

  const [yearText, monthText] = selectedMonth.split("/");
  const year = Number(yearText);
  const month = Number(monthText);

  const targetKeys = Object.keys(data)
    .sort()
    .filter((dateKey) => {
      const date = new Date(dateKey);

      return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month
      );
    });

  let text = `【日記】${year}年${month}月\n\n`;

  targetKeys.forEach((dateKey) => {
    const date = new Date(dateKey);
    const day = date.getDate();

    text += "────────────\n";
    text += `▼${month}月${day}日\n`;
    text += "────────────\n";

    data[dateKey].forEach((item) => {
      text += `${item}\n`;
    });

    text += "\n";
  });

  text += "────────────\n";

  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `日記_${year}-${String(month).padStart(2, "0")}.txt`;
  a.click();

  URL.revokeObjectURL(url);
}

function getGoalData() {
  return JSON.parse(localStorage.getItem(GOAL_STORAGE_KEY)) || [];
}

function getScheduleData() {
  return JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY)) || [];
}

function setScheduleData(data) {
  localStorage.setItem(
    SCHEDULE_STORAGE_KEY,
    JSON.stringify(data),
  );
}

function addScheduleFromInput() {
  const lines = scheduleInput.value
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return;

  lines.forEach((line) => {
    saveScheduleItem(line);
  });

  scheduleInput.value = "";
  scheduleInput.focus();

  renderScheduleList();
}

function saveScheduleItem(text) {
  const data = getScheduleData();
  const parsed = parseScheduleDate(text);

  data.push({
    text: parsed.text || text,
    dateKey: parsed.dateKey,
    done: false,
    createdAt: formatDateKey(new Date()),
  });

  setScheduleData(data);
}

function renderScheduleList() {
  const schedules = getScheduleData();

  const sortedSchedules = [...schedules].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    if (a.dateKey && b.dateKey) {
      return a.dateKey.localeCompare(b.dateKey);
    }

    if (a.dateKey && !b.dateKey) return -1;
    if (!a.dateKey && b.dateKey) return 1;
    return 0;
  });

  scheduleList.innerHTML = "";

  sortedSchedules.forEach((schedule) => {
    const index = schedules.indexOf(schedule);

    const item = document.createElement("div");
    item.className = "common-item";

    const realTodayKey = formatDateKey(new Date());

    if (schedule.done) {
      item.classList.add("done");
    } else if (schedule.dateKey === realTodayKey) {
      item.classList.add("today");
    }

    if (schedule.done && isScheduleDoneDeleteMode) {
      item.classList.add("delete-warning");
    }

    const editButton = document.createElement("div");
    editButton.className = "edit-button";
    editButton.innerHTML = `<span class="material-symbols-outlined">edit</span>`;

    const deleteButton = document.createElement("div");
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = `<span class="material-symbols-outlined">delete</span>`;

    const swipeContent = document.createElement("div");
    swipeContent.className = "swipe-content";

    const content = document.createElement("div");
    content.className = "text";

    if (schedule.dateKey) {
      const date = new Date(schedule.dateKey);
      content.textContent =
        `${date.getMonth() + 1}/${date.getDate()} ${schedule.text}`;
    } else {
      content.textContent = schedule.text;
    }

    swipeContent.addEventListener("click", () => {
      if (isScheduleDoneDeleteMode) {
        isScheduleDoneDeleteMode = false;
        renderScheduleList();
        return;
      }

      const isContentEditing =
        isEditing || content.classList.contains("editing");

      if (isContentEditing) {
        isEditing = false;
        content.contentEditable = "false";
        content.classList.remove("editing");

        if (isPcPointer() && schedule.done) {
          closeSwipeActions(item);
          item.classList.add("show-actions");
        }

        return;
      }

      if (item.classList.contains("show-edit")) return;
      if (item.classList.contains("show-delete")) return;

      if (isPcPointer()) {
        if (item.classList.contains("show-actions")) {
          item.classList.remove("show-actions");
          toggleScheduleDone(index);
          renderScheduleList();
          return;
        }

        if (schedule.done) {
          closeSwipeActions(item);
          item.classList.add("show-actions");
          return;
        }

        toggleScheduleDone(index);
        renderScheduleList();
        return;
      }

      toggleScheduleDone(index);
      renderScheduleList();
    });

    let isEditing = false;

    editButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (isScheduleDoneDeleteMode) {
        isScheduleDoneDeleteMode = false;
        renderScheduleList();
        return;
      }

      if (!isEditing) {
        isEditing = true;

        item.classList.remove("show-actions");
        item.classList.add("show-edit");

        content.contentEditable = "true";
        content.classList.add("editing");
        content.focus();
        return;
      }

      isEditing = false;
      content.contentEditable = "false";
      content.classList.remove("editing");

      updateScheduleItemFromEditableText(index, content.textContent.trim(), schedule);

      item.classList.remove("show-edit");
      renderScheduleList();
    });

    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (isScheduleDoneDeleteMode) {
        isScheduleDoneDeleteMode = false;
        renderScheduleList();
        return;
      }
      deleteScheduleItemByIndex(index);
      renderScheduleList();
    });

    swipeContent.appendChild(content);

    item.appendChild(editButton);
    item.appendChild(deleteButton);
    item.appendChild(swipeContent);

    scheduleList.appendChild(item);

    setupSwipeActions(item, {
      shouldBlock: () => isScheduleDoneDeleteMode,
    });
  });
  scheduleDangerArea.innerHTML = "";

  const hasDoneSchedule = schedules.some((schedule) => schedule.done);

  if (hasDoneSchedule) {
    const deleteDoneButton = document.createElement("button");
    deleteDoneButton.type = "button";
    deleteDoneButton.className = "goal-sort-button";

    if (isScheduleDoneDeleteMode) {
      deleteDoneButton.classList.add("delete-mode");
    }
    deleteDoneButton.textContent = isScheduleDoneDeleteMode
      ? "もう一度押して削除"
      : "終了した予定を削除";

    deleteDoneButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!isScheduleDoneDeleteMode) {
        isScheduleDoneDeleteMode = true;
        renderScheduleList();
        return;
      }

      deleteDoneSchedules();
      isScheduleDoneDeleteMode = false;
      renderScheduleList();
    });

    scheduleDangerArea.appendChild(deleteDoneButton);
  }
}

function updateScheduleItemFromEditableText(index, editableText, oldSchedule) {
  const schedules = getScheduleData();

  const match = editableText.match(/^(\d{1,2})[\/／.-](\d{1,2})\s+(.+)$/);

  if (!match) {
    schedules[index] = {
      ...schedules[index],
      text: editableText,
      dateKey: oldSchedule.dateKey || "",
    };

    setScheduleData(schedules);
    return;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const text = match[3].trim();

  const baseYear = oldSchedule.dateKey
    ? Number(oldSchedule.dateKey.slice(0, 4))
    : new Date().getFullYear();

  const date = new Date(baseYear, month - 1, day);

  const isValidDate =
    date.getFullYear() === baseYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isValidDate || !text) {
    schedules[index] = {
      ...schedules[index],
      text: editableText,
      dateKey: oldSchedule.dateKey || "",
    };

    setScheduleData(schedules);
    return;
  }

  schedules[index] = {
    ...schedules[index],
    text,
    dateKey: formatDateKey(date),
  };

  setScheduleData(schedules);
}

function setGoalData(data) {
  localStorage.setItem(
    GOAL_STORAGE_KEY,
    JSON.stringify(data),
  );
}

function saveGoalItem(text) {
  const data = getGoalData();

  data.push({
    text,
    createdAt: formatDateKey(new Date()),
    color: null,
  });

  setGoalData(data);
}

function renderGoalList() {
  const goals = getGoalData();

  goalList.innerHTML = "";

  goals.forEach((goal, index) => {
    const text =
      typeof goal === "string"
        ? goal
        : goal.text;

    const color =
      typeof goal === "string"
        ? null
        : goal.color || null;

    addGoalItem(text, index, color);
  });
}

function addGoalItem(text, index, color = null) {
  const item = document.createElement("div");
  item.className = "common-item goal-item";

  if (color === "green") {
    item.classList.add("goal-color-green");
  }

  if (color === "gray") {
    item.classList.add("goal-color-gray");
  }

  const swipeContent = document.createElement("div");
  swipeContent.className = "swipe-content";

  if (isGoalDeleteMode) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "goal-checkbox";
    checkbox.dataset.index = index;

    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    swipeContent.appendChild(checkbox);
  }

  if (isGoalSortMode) {
    const leftHandle = document.createElement("div");
    leftHandle.className = "goal-sort-handle";
    setupGoalSortHandle(leftHandle, item, index);
    swipeContent.appendChild(leftHandle);
  }

  const content = document.createElement("div");
  content.className = "text";
  content.textContent = text;
  swipeContent.appendChild(content);

  if (isGoalColorMode) {
    const colorControls = document.createElement("div");
    colorControls.className = "goal-color-controls";

    const greenButton = document.createElement("button");
    greenButton.type = "button";
    greenButton.className = "goal-color-chip green";

    greenButton.addEventListener("click", (event) => {
      event.stopPropagation();
      updateGoalColor(index, "green");
      renderGoalList();
    });

    const grayButton = document.createElement("button");
    grayButton.type = "button";
    grayButton.className = "goal-color-chip gray";

    grayButton.addEventListener("click", (event) => {
      event.stopPropagation();
      updateGoalColor(index, "gray");
      renderGoalList();
    });

    colorControls.appendChild(greenButton);
    colorControls.appendChild(grayButton);
    swipeContent.appendChild(colorControls);
  }

  if (isGoalSortMode) {
    const rightHandle = document.createElement("div");
    rightHandle.className = "goal-sort-handle";
    setupGoalSortHandle(rightHandle, item, index);
    swipeContent.appendChild(rightHandle);
  }

  const editButton = document.createElement("div");
  editButton.className = "edit-button";
  editButton.innerHTML = `<span class="material-symbols-outlined">edit</span>`;

  const deleteButton = document.createElement("div");
  deleteButton.className = "delete-button";
  deleteButton.innerHTML = `<span class="material-symbols-outlined">delete</span>`;

  let isEditing = false;

  setupPcActionMenu(item, swipeContent, {
    shouldBlock: () =>
      isEditing ||
      isGoalDeleteMode ||
      isGoalSortMode ||
      isGoalColorMode,
  });


  editButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!isEditing) {
      isEditing = true;

      item.classList.remove("show-actions");
      item.classList.add("show-edit");

      content.contentEditable = "true";
      content.classList.add("editing");
      content.focus();
      return;
    }

    isEditing = false;
    content.contentEditable = "false";
    content.classList.remove("editing");

    updateGoalItem(index, content.textContent.trim());

    item.classList.remove("show-edit");
    renderGoalList();
  });

  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();

    deleteGoalItemByIndex(index);
    renderGoalList();
  });

  item.appendChild(editButton);
  item.appendChild(deleteButton);
  item.appendChild(swipeContent);
  goalList.appendChild(item);

  setupSwipeActions(item, {
    shouldBlock: () => isGoalDeleteMode || isGoalSortMode || isGoalColorMode,
  });

  item.addEventListener("click", () => {
    if (!isGoalDeleteMode) return;

    const checkbox = item.querySelector(".goal-checkbox");

    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
  });
}

function setupGoalSortHandle(handle, item, startIndex) {
  let ghost = null;
  let offsetY = 0;
  let isDragging = false;
  let ghostHeight = 0;

  function onPointerMove(event) {
    if (!isDragging || !ghost) return;

    ghost.style.top = `${event.clientY - offsetY}px`;
    updateGoalDropPreview(event.clientY);
  }

  function onPointerUp(event) {
    if (!isDragging) return;

    isDragging = false;

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);

    const toIndex = getGoalDropIndex(event.clientY);

    clearGoalDropPreview();
    goalList.style.removeProperty("--goal-drop-space");

    if (ghost) {
      ghost.remove();
      ghost = null;
    }

    item.classList.remove("drag-placeholder");

    if (!moveGoalItem(startIndex, toIndex)) {
      renderGoalList();
    }
  }

  handle.addEventListener("pointerdown", (event) => {
    if (!isGoalSortMode) return;

    event.preventDefault();

    const rect = item.getBoundingClientRect();

    ghostHeight = rect.height;
    goalList.style.setProperty("--goal-drop-space", `${ghostHeight}px`);

    offsetY = event.clientY - rect.top;

    ghost = item.cloneNode(true);
    ghost.classList.add("goal-drag-ghost");
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;

    document.body.appendChild(ghost);

    item.classList.add("drag-placeholder");

    isDragging = true;
    updateGoalDropPreview(event.clientY);

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  });
}

function getGoalDropIndex(pointerY) {
  const items = Array.from(
    goalList.querySelectorAll(".goal-item:not(.drag-placeholder)"),
  );

  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    const centerY = rect.top + rect.height * 0.75;

    if (pointerY < centerY) return i;
  }

  return items.length;
}

function moveGoalItem(fromIndex, toIndex) {
  const data = getGoalData();

  if (!data[fromIndex]) return false;
  if (toIndex < 0) return false;

  if (toIndex > data.length - 1) {
    toIndex = data.length - 1;
  }

  const movedGoal = data.splice(fromIndex, 1)[0];

  if (toIndex > data.length) {
    toIndex = data.length;
  }

  data.splice(toIndex, 0, movedGoal);

  setGoalData(data);
  renderGoalList();

  return true;
}

function updateGoalItem(index, newText) {
  const data = getGoalData();

  if (!newText) return;
  if (!data[index]) return;

  if (typeof data[index] === "string") {
    data[index] = newText;
  } else {
    data[index].text = newText;
  }

  setGoalData(data);
}

function updateGoalColor(index, color) {
  const data = getGoalData();
  const goal = data[index];

  if (!goal) return;

  const currentColor =
    typeof goal === "string"
      ? null
      : goal.color || null;

  const nextColor = currentColor === color ? null : color;

  if (typeof goal === "string") {
    data[index] = {
      text: goal,
      createdAt: formatDateKey(new Date()),
      color: nextColor,
    };
  } else {
    data[index] = {
      ...goal,
      color: nextColor,
    };
  }

  setGoalData(data);
}

function deleteGoalItemByIndex(index) {
  const data = getGoalData();

  if (!data[index]) return;

  data.splice(index, 1);

  setGoalData(data);
}

function toggleGoalMultiDelete() {
  const nextMode = !isGoalDeleteMode;

  if (!nextMode) {
    const checkedBoxes = goalList.querySelectorAll(".goal-checkbox:checked");

    if (checkedBoxes.length > 0) {
      const deleteIndexes = Array.from(checkedBoxes).map((checkbox) =>
        Number(checkbox.dataset.index),
      );

      deleteGoalItems(deleteIndexes);
    }

    resetGoalModes();
    renderGoalList();
    return;
  }

  resetGoalModes();

  isGoalDeleteMode = true;
  goalMultiDeleteButton.textContent = "削除する";
  goalMultiDeleteButton.classList.add("delete-mode");

  renderGoalList();
}

function toggleGoalSortMode() {
  const nextMode = !isGoalSortMode;
  resetGoalModes();
  isGoalSortMode = nextMode;

  goalSortButton.textContent = isGoalSortMode ? "並び替え完了" : "並び替え";

  goalSortButton.classList.toggle("sort-mode", isGoalSortMode,
  );
  goalList.classList.toggle("sort-mode", isGoalSortMode,
  );
  renderGoalList();
}

function deleteGoalItems(indexes) {
  const data = getGoalData();
  const filtered = data.filter((_, index) => !indexes.includes(index));

  setGoalData(filtered);
}

function addHabitFromInput() {
  const taskText = habitInput.value.trim();

  if (!taskText) {
    habitInput.focus();
    return;
  }

  if (editingHabitIndex !== null) {
    const data = getHabitData();

    if (data[editingHabitIndex]) {
      data[editingHabitIndex].text = taskText;
      setHabitData(data);
      selectedHabitIndex = editingHabitIndex;
    }

    editingHabitIndex = null;
    habitAddSubmitButton.textContent = "追加";
  } else {
    saveHabitItem(taskText);
    selectedHabitIndex = getHabitData().length - 1;
  }

  habitInput.value = "";
  habitInput.focus();
  renderHabitList();
}

function getHabitData() {
  return JSON.parse(localStorage.getItem(HABIT_STORAGE_KEY)) || [];
}

function setHabitData(data) {
  localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(data));
}

function saveHabitItem(text) {
  const data = getHabitData();

  data.push({ text, doneDates: [] });
  setHabitData(data);
}

function toggleHabitDone(index) {
  const data = getHabitData();

  if (!data[index]) return;

  if (!Array.isArray(data[index].doneDates)) data[index].doneDates = [];

  const doneIndex = data[index].doneDates.indexOf(todayKey);

  if (doneIndex >= 0) {
    data[index].doneDates.splice(doneIndex, 1);
  } else {
    data[index].doneDates.push(todayKey);
  }

  setHabitData(data);
  selectedHabitIndex = index;
  renderHabitList();
  renderHabitCalendar();
}

function toggleHabitDoneByDate(index, dateKey) {
  const data = getHabitData();

  if (!data[index]) return;

  if (!Array.isArray(data[index].doneDates)) data[index].doneDates = [];

  const doneIndex = data[index].doneDates.indexOf(dateKey);

  if (doneIndex >= 0) {
    data[index].doneDates.splice(doneIndex, 1);
  } else {
    data[index].doneDates.push(dateKey);
  }

  setHabitData(data);
  selectedHabitIndex = index;
  renderHabitList();
  renderHabitCalendar();
}

function renderHabitList() {
  const habits = getHabitData();

  habitList.innerHTML = "";

  if (habits.length === 0) {
    selectedHabitIndex = null;

    habitCalendar.classList.remove("open");
    habitCalendar.innerHTML = "";

    const habitDangerArea = document.getElementById("habitDangerArea");
    habitDangerArea.innerHTML = "";

    return;
  }

  if (selectedHabitIndex !== null && !habits[selectedHabitIndex]) {
    selectedHabitIndex = null;
  }

  habits.forEach((habit, index) => {
    const button = document.createElement("button");
    button.className = "habit-task-button";
    button.textContent = habit.text;
    button.type = "button";

    const isDoneToday =
      Array.isArray(habit.doneDates) &&
      habit.doneDates.includes(todayKey);

    if (isDoneToday) button.classList.add("done-today");
    if (selectedHabitIndex === index) button.classList.add("selected");

    setupHabitButtonPress(button, index);
    habitList.appendChild(button);
  });

  renderHabitCalendar();
}

function setupHabitButtonPress(button, index) {
  button.addEventListener("click", () => {
    toggleHabitDone(index);

    selectedHabitIndex = index;
    renderHabitList();
    renderHabitCalendar();
  });
}

function setupHabitCalendarDayPress(cell, dateKey) {
  let longPressTimer = null;
  let didLongPress = false;
  const longPressDuration = 550;

  cell.addEventListener("pointerdown", (event) => {
    didLongPress = false;
    cell.classList.add("long-pressing");
    cell.setPointerCapture(event.pointerId);

    longPressTimer = setTimeout(() => {
      didLongPress = true;
      cell.classList.remove("long-pressing");

      toggleHabitDoneByDate(selectedHabitIndex, dateKey);
    }, longPressDuration);
  });

  cell.addEventListener("pointerup", () => {
    clearTimeout(longPressTimer);
    cell.classList.remove("long-pressing");
  });

  cell.addEventListener("pointercancel", () => {
    clearTimeout(longPressTimer);
    cell.classList.remove("long-pressing");
  });

  cell.addEventListener("pointerleave", () => {
    clearTimeout(longPressTimer);
    cell.classList.remove("long-pressing");
  });
}

function renderHabitCalendar() {
  const habits = getHabitData();
  const habitDangerArea = document.getElementById("habitDangerArea");

  if (selectedHabitIndex === null || !habits[selectedHabitIndex]) {
    habitCalendar.classList.remove("open");
    habitCalendar.innerHTML = "";
    habitDangerArea.innerHTML = "";
    return;
  }

  const habit = habits[selectedHabitIndex];
  const baseDate = new Date(
    today.getFullYear(),
    today.getMonth() + habitCalendarMonthOffset, 1);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = baseDate.getDay();
  const doneDates = Array.isArray(habit.doneDates) ? habit.doneDates : [];

  habitDangerArea.innerHTML = "";
  habitCalendar.innerHTML = "";
  habitCalendar.classList.add("open");

  const title = document.createElement("div");
  title.className = "habit-calendar-title";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "month-nav-button";
  prevButton.textContent = "◀";
  prevButton.addEventListener("click", () => {
    habitCalendarMonthOffset--;
    renderHabitCalendar();
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "month-nav-button";
  nextButton.textContent = "▶";
  nextButton.disabled = habitCalendarMonthOffset >= 0;
  nextButton.addEventListener("click", () => {
    if (habitCalendarMonthOffset >= 0) return;

    habitCalendarMonthOffset++;
    renderHabitCalendar();
  });

  const titleButton = document.createElement("button");
  titleButton.type = "button";
  titleButton.className = "habit-calendar-title-button";
  titleButton.textContent = `${habit.text}｜${year}年${month + 1}月`;

  titleButton.addEventListener("click", () => {
    showHabitTitleEdit(selectedHabitIndex, title);
  });

  title.appendChild(prevButton);
  title.appendChild(titleButton);
  title.appendChild(nextButton);
  habitCalendar.appendChild(title);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger-button habit-delete-button";
  deleteButton.textContent = "この習慣を削除";

  deleteButton.addEventListener("click", () => {
    deleteSelectedHabit();
  });

  habitDangerArea.appendChild(deleteButton);

  const grid = document.createElement("div");
  grid.className = "habit-calendar-grid";

  ["日", "月", "火", "水", "木", "金", "土"].forEach((weekday) => {
    const cell = document.createElement("div");
    cell.className = "habit-calendar-weekday";
    cell.textContent = weekday;
    grid.appendChild(cell);
  });

  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "habit-calendar-day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateKey =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "habit-calendar-day";
    cell.textContent = day;

    if (doneDates.includes(dateKey)) cell.classList.add("done");

    setupHabitCalendarDayPress(cell, dateKey);
    grid.appendChild(cell);
  }

  habitCalendar.appendChild(grid);
}

function showHabitTitleEdit(index, titleElement) {
  const data = getHabitData();

  if (!data[index]) return;

  titleElement.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = data[index].text;
  input.className = "habit-title-edit-input";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "変更";
  button.className = "habit-title-edit-button";

  button.addEventListener("click", () => {
    const newName = input.value.trim();

    if (!newName) return;

    const latestData = getHabitData();

    if (!latestData[index]) return;

    latestData[index].text = newName;
    setHabitData(latestData);

    selectedHabitIndex = index;
    renderHabitList();
    renderHabitCalendar();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") button.click();
  });

  titleElement.appendChild(input);
  titleElement.appendChild(button);

  input.focus();
  input.select();
}

function deleteSelectedHabit() {
  const data = getHabitData();

  if (selectedHabitIndex === null || !data[selectedHabitIndex]) {
    alert("削除できる習慣がありません。");
    return;
  }

  const targetName = data[selectedHabitIndex].text;

  const firstConfirm = confirm(
    `「${targetName}」を削除します。\n\n` +
    "この操作は元に戻せません。\n\n" +
    "削除しますか？",
  );

  if (!firstConfirm) return;

  const typed = prompt(
    `本当に「${targetName}」を削除する場合は、\n` +
    "「削除」と入力してください。",
  );

  if (typed !== "削除") {
    alert("削除をキャンセルしました。");
    return;
  }

  data.splice(selectedHabitIndex, 1);
  setHabitData(data);

  if (data.length === 0) {
    selectedHabitIndex = null;
  } else if (selectedHabitIndex >= data.length) {
    selectedHabitIndex = data.length - 1;
  }

  renderHabitList();
  renderHabitCalendar();

  alert(`「${targetName}」を削除しました。`);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateSwitchHour() {
  const mode =
    localStorage.getItem(DATE_SWITCH_MODE_KEY) || "fixed";

  if (mode === "fixed") return 4;

  const hour = Number(
    localStorage.getItem(DATE_SWITCH_HOUR_KEY)
  );

  if (Number.isNaN(hour)) return 4;

  return Math.min(6, Math.max(0, hour));
}

function getLogicalToday() {
  const now = new Date();
  const logicalDate = new Date(now);
  const switchHour = getDateSwitchHour();

  logicalDate.setHours(
    logicalDate.getHours() - switchHour
  );

  return logicalDate;
}

function deleteOldestMonthDiary() {
  const data = getDiaryData();
  const dateKeys = Object.keys(data).sort();

  if (dateKeys.length === 0) {
    alert("削除できる日記がありません。");
    return;
  }

  const oldestDate = new Date(dateKeys[0]);
  const year = oldestDate.getFullYear();
  const month = oldestDate.getMonth() + 1;
  const targetMonth = `${year}/${month}`;

  const firstConfirm = confirm(
    `${targetMonth} の日記を削除します。\n\n` +
    "この操作は元に戻せません。\n" +
    "先にtxtファイルで保存しているか確認してください。\n\n" +
    "削除しますか？",
  );

  if (!firstConfirm) return;

  const typed = prompt(
    `本当に ${targetMonth} の日記を削除する場合は、\n` +
    "「削除」と入力してください。",
  );

  if (typed !== "削除") {
    alert("削除をキャンセルしました。");
    return;
  }

  Object.keys(data).forEach((dateKey) => {
    const date = new Date(dateKey);

    if (date.getFullYear() === year && date.getMonth() + 1 === month) {
      delete data[dateKey];
    }
  });

  setDiaryData(data);

  selectedPastDateKey = null;
  pastDiaryList.classList.remove("open");
  pastDiaryList.innerHTML = "";

  renderTodayDiary();
  renderPastDateButtons();
  renderMonthSelect();

  alert(`${targetMonth} の日記を削除しました。`);
}

function openHelp() {
  closeSwipeActions();
  isScheduleDoneDeleteMode = false;

  if (activeTabId === "help") {
    activeTabId = lastMainTabId;
  } else {
    activeTabId = "help";
  }

  renderTabs();
  renderPanels();
}

function clearGoalDropPreview() {
  const items = goalList.querySelectorAll(".goal-item");

  items.forEach((item) => {
    item.classList.remove("drop-preview-before");
    item.classList.remove("drop-preview-after");
  });
}

function updateGoalDropPreview(pointerY) {
  const items = Array.from(
    goalList.querySelectorAll(".goal-item:not(.drag-placeholder)"),
  );

  const dropIndex = getGoalDropIndex(pointerY);

  clearGoalDropPreview();

  if (items.length === 0) return;

  if (dropIndex >= items.length) {
    items[items.length - 1].classList.add("drop-preview-after");
    return;
  }

  items[dropIndex].classList.add("drop-preview-before");
}

function openSettings() {
  closeSwipeActions();
  isScheduleDoneDeleteMode = false;

  if (activeTabId === "settings") {
    activeTabId = lastMainTabId;
  } else {
    activeTabId = "settings";
  }

  renderTabs();
  renderPanels();
}

function renderPastDiaryCalendar() {
  pastDiaryCalendar.innerHTML = "";

  if (!isPastDiaryCalendarOpen) {
    pastDiaryCalendar.classList.remove("open");
    return;
  }

  pastDiaryCalendar.classList.add("open");
  const data = getDiaryData();
  const baseDate = new Date(today.getFullYear(), today.getMonth() + pastDiaryCalendarMonthOffset, 1);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = baseDate.getDay();

  const title = document.createElement("div");
  title.className = "habit-calendar-title";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "month-nav-button";
  prevButton.textContent = "◀";
  prevButton.addEventListener("click", () => {
    pastDiaryCalendarMonthOffset--;
    renderPastDiaryCalendar();
  });

  const titleText = document.createElement("div");
  titleText.className = "habit-calendar-title-button";
  titleText.textContent = `${year}年${month + 1}月の日記`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "month-nav-button";
  nextButton.textContent = "▶";
  nextButton.disabled = pastDiaryCalendarMonthOffset >= 0;
  nextButton.addEventListener("click", () => {
    if (pastDiaryCalendarMonthOffset >= 0) return;

    pastDiaryCalendarMonthOffset++;
    renderPastDiaryCalendar();
  });

  title.appendChild(prevButton);
  title.appendChild(titleText);
  title.appendChild(nextButton);
  pastDiaryCalendar.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "habit-calendar-grid";

  ["日", "月", "火", "水", "木", "金", "土"].forEach((weekday) => {
    const cell = document.createElement("div");
    cell.className = "habit-calendar-weekday";
    cell.textContent = weekday;
    grid.appendChild(cell);
  });

  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "habit-calendar-day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateKey =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "habit-calendar-day";
    cell.textContent = day;

    if (data[dateKey]) cell.classList.add("done");

    cell.addEventListener("click", () => {
      renderPastDiary(dateKey);
    });

    grid.appendChild(cell);
  }

  pastDiaryCalendar.appendChild(grid);
}

function parseScheduleDate(text) {
  const currentYear = new Date().getFullYear();
  let match = text.match(/^(\d{2})(\d{2})\s*(.*)$/);

  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);

    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return {
        dateKey: formatDateKey(
          new Date(currentYear, month - 1, day)
        ),
        text: match[3].trim(),
      };
    }
  }

  match = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*(.*)$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return {
      dateKey: formatDateKey(new Date(year, month - 1, day)),
      text: match[4].trim(),
    };
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})\s*(.*)$/);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    return {
      dateKey: formatDateKey(new Date(currentYear, month - 1, day)), text: match[3].trim(),
    };
  }

  match = text.match(/^(\d{1,2})月(\d{1,2})日\s*(.*)$/);
  if (match) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    return {
      dateKey: formatDateKey(new Date(currentYear, month - 1, day)),
      text: match[3].trim(),
    };
  }

  return {
    dateKey: null, text,
  };
}

function updateScheduleItem(index, text) {
  const data = getScheduleData();
  const parsed = parseScheduleDate(text);

  if (!data[index]) return;

  data[index].text = parsed.text || text;
  data[index].dateKey = parsed.dateKey;

  setScheduleData(data);
}

function deleteScheduleItemByIndex(index) {
  const data = getScheduleData();

  data.splice(index, 1);

  setScheduleData(data);
}

function toggleScheduleDone(index) {
  const data = getScheduleData();

  if (!data[index]) return;

  data[index].done = !data[index].done;

  setScheduleData(data);
}

function deleteDoneSchedules() {
  const data = getScheduleData();
  const activeSchedules = data.filter((schedule) => !schedule.done);

  setScheduleData(activeSchedules);
  renderScheduleList();
}

function addDiaryFromInput() {
  const lines = diaryInput.value
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return;

  lines.forEach((line) => {
    saveDiaryItem(todayKey, line);
  });

  diaryInput.value = "";
  diaryInput.focus();

  renderTodayDiary();
  renderPastDateButtons();
  renderMonthSelect();
}

function addGoalFromInput() {
  const lines = goalInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    goalInput.focus();
    return;
  }

  lines.forEach((line) => {
    saveGoalItem(line);
  });

  goalInput.value = "";
  goalInput.focus();

  renderGoalList();
}

function toggleGoalColorMode() {
  const nextMode = !isGoalColorMode;
  resetGoalModes();
  isGoalColorMode = nextMode;

  goalColorButton.textContent = isGoalColorMode ? "色分け完了" : "色分け";

  goalColorButton.classList.toggle("color-mode", isGoalColorMode);
  goalList.classList.toggle("color-mode", isGoalColorMode);

  renderGoalList();
}

function resetGoalModes() {
  isGoalColorMode = false;
  isGoalSortMode = false;
  isGoalDeleteMode = false;

  goalColorButton.classList.remove("color-mode");
  goalSortButton.classList.remove("sort-mode");
  goalList.classList.remove("sort-mode");
  goalList.classList.remove("color-mode");

  goalSortButton.textContent = "並び替え";
  goalMultiDeleteButton.textContent = "複数削除";
  goalMultiDeleteButton.classList.remove("delete-mode");
}

function setupDateSwitchRange() {
  const dateSwitchRange =
    document.getElementById("dateSwitchRange");

  const dateSwitchCurrent =
    document.getElementById("dateSwitchCurrent");

  if (
    !fixedRadio ||
    !customRadio ||
    !customArea ||
    !dateSwitchRange ||
    !dateSwitchCurrent
  ) return;

  applyDateSwitchSettingsToUI();

  dateSwitchRange.addEventListener("input", () => {
    dateSwitchCurrent.textContent =
      `現在：${dateSwitchRange.value}時`;

    localStorage.setItem(DATE_SWITCH_MODE_KEY, "custom");
    localStorage.setItem(DATE_SWITCH_HOUR_KEY, dateSwitchRange.value);
  });

  fixedRadio.addEventListener("change", () => {
    localStorage.setItem(DATE_SWITCH_MODE_KEY, "fixed");
    localStorage.setItem(DATE_SWITCH_HOUR_KEY, "4");
    updateDateSwitchMode();
  });

  customRadio.addEventListener("change", () => {
    localStorage.setItem(DATE_SWITCH_MODE_KEY, "custom");
    updateDateSwitchMode();
  });

  updateDateSwitchMode();
}

function applyDateSwitchSettingsToUI() {
  const dateSwitchRange =
    document.getElementById("dateSwitchRange");

  const dateSwitchCurrent =
    document.getElementById("dateSwitchCurrent");

  if (
    !fixedRadio ||
    !customRadio ||
    !customArea ||
    !dateSwitchRange ||
    !dateSwitchCurrent
  ) return;

  const savedMode =
    localStorage.getItem(DATE_SWITCH_MODE_KEY) || "fixed";

  const savedHour =
    localStorage.getItem(DATE_SWITCH_HOUR_KEY) || "4";

  if (savedMode === "custom") {
    customRadio.checked = true;
    fixedRadio.checked = false;
  } else {
    fixedRadio.checked = true;
    customRadio.checked = false;
  }

  dateSwitchRange.value = savedHour;
  dateSwitchCurrent.textContent = `現在：${savedHour}時`;

  updateDateSwitchMode();
}

function updateDateSwitchMode() {
  if (fixedRadio.checked) {
    customArea.style.display = "none";

    document.getElementById(
      "dateSwitchCurrent"
    ).textContent = "現在：4時";

    document.getElementById(
      "dateSwitchRange"
    ).value = 4;

    return;
  }

  customArea.style.display = "block";
}

function createBackupData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: "こえ手帳",
    diary: getDiaryData(),
    goals: getGoalData(),
    habits: getHabitData(),
    schedules: getScheduleData(),
    tabOrder: tabOrder.map((tab) => tab.id),
    settings: {
      dateSwitchMode:
        localStorage.getItem(DATE_SWITCH_MODE_KEY) || "fixed",
      dateSwitchHour:
        localStorage.getItem(DATE_SWITCH_HOUR_KEY) || "4",
    },
  };
}

function exportBackup() {
  const backupData = createBackupData();
  const text = JSON.stringify(backupData, null, 2);
  const blob = new Blob([text], {
    type: "application/json;charset=utf-8",
  });

  const todayText = formatDateKey(new Date());
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `こえ手帳_backup_${todayText}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

function isValidBackupData(data) {
  if (!isValidBackupRoot(data)) return false;
  if (!isValidDiaryData(data.diary)) return false;
  if (!isValidGoalData(data.goals)) return false;
  if (!isValidHabitData(data.habits)) return false;
  if (!isValidScheduleData(data.schedules)) return false;
  if (!isValidTabOrder(data.tabOrder)) return false;
  if (!isValidBackupSettings(data.settings)) return false;

  return true;
}

// ===== バックアップ検証 =====

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidDateKey(value) {
  if (typeof value !== "string") return false;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return false;

  const lastDay = new Date(year, month, 0).getDate();

  return day >= 1 && day <= lastDay;
}

function isValidBackupRoot(data) {
  if (!isPlainObject(data)) return false;
  if (data.version !== 1) return false;
  if (data.appName !== "こえ手帳") return false;

  if (typeof data.exportedAt !== "string") return false;
  if (Number.isNaN(Date.parse(data.exportedAt))) return false;

  return true;
}

function isValidDiaryData(diary) {
  if (!isPlainObject(diary)) return false;

  return Object.entries(diary).every(([dateKey, items]) => {
    if (!isValidDateKey(dateKey)) return false;
    if (!Array.isArray(items)) return false;

    return items.every((item) => typeof item === "string");
  });
}

function isValidGoalData(goals) {
  if (!Array.isArray(goals)) return false;

  return goals.every((goal) => {
    if (typeof goal === "string") return true;

    if (!isPlainObject(goal)) return false;
    if (typeof goal.text !== "string") return false;

    if (
      goal.createdAt !== undefined &&
      !isValidDateKey(goal.createdAt)
    ) {
      return false;
    }

    if (
      goal.color !== undefined &&
      goal.color !== null &&
      goal.color !== "green" &&
      goal.color !== "gray"
    ) {
      return false;
    }

    if (
      goal.done !== undefined &&
      typeof goal.done !== "boolean"
    ) {
      return false;
    }

    return true;
  });
}

function isValidHabitData(habits) {
  if (!Array.isArray(habits)) return false;

  return habits.every((habit) => {
    if (!isPlainObject(habit)) return false;
    if (typeof habit.text !== "string") return false;
    if (!Array.isArray(habit.doneDates)) return false;

    return habit.doneDates.every((dateKey) =>
      isValidDateKey(dateKey)
    );
  });
}

function isValidScheduleData(schedules) {
  if (!Array.isArray(schedules)) return false;

  return schedules.every((schedule) => {
    if (!isPlainObject(schedule)) return false;
    if (typeof schedule.text !== "string") return false;
    if (typeof schedule.done !== "boolean") return false;

    if (
      schedule.dateKey !== null &&
      !isValidDateKey(schedule.dateKey)
    ) {
      return false;
    }

    if (
      schedule.createdAt !== undefined &&
      !isValidDateKey(schedule.createdAt)
    ) {
      return false;
    }

    return true;
  });
}

function isValidTabOrder(tabIds) {
  if (!Array.isArray(tabIds)) return false;

  const validTabIds = ["diary", "goal", "habit", "schedule"];

  if (tabIds.length !== validTabIds.length) return false;

  const tabIdSet = new Set(tabIds);

  if (tabIdSet.size !== validTabIds.length) return false;

  return validTabIds.every((tabId) => tabIdSet.has(tabId));
}

function isValidBackupSettings(settings) {
  if (!isPlainObject(settings)) return false;

  if (
    settings.dateSwitchMode !== "fixed" &&
    settings.dateSwitchMode !== "custom"
  ) {
    return false;
  }

  if (
    typeof settings.dateSwitchHour !== "string" &&
    typeof settings.dateSwitchHour !== "number"
  ) {
    return false;
  }

  const hour = Number(settings.dateSwitchHour);

  return Number.isInteger(hour) && hour >= 0 && hour <= 6;
}


// ===== /バックアップ検証 =====

function importBackup(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    let backupData = null;

    try {
      backupData = JSON.parse(reader.result);
    } catch {
      alert("バックアップファイルを読み込めませんでした。");
      importBackupInput.value = "";
      return;
    }

    if (!isValidBackupData(backupData)) {
      alert("こえ手帳のバックアップファイルではない可能性があります。");
      importBackupInput.value = "";
      return;
    }

    restoreBackupData(backupData);
    importBackupInput.value = "";
  };

  reader.readAsText(file);
}

function confirmRestoreBackup() {
  const firstConfirm = confirm(
    "現在のデータをバックアップファイルの内容で上書きします。\n\n" +
    "この操作は元に戻せません。\n\n" +
    "復元しますか？",
  );

  if (!firstConfirm) return false;

  const typed = prompt(
    "本当に復元する場合は、\n" +
    "「復元」と入力してください。",
  );

  if (typed !== "復元") {
    alert("復元をキャンセルしました。");
    return false;
  }

  return true;
}

function restoreBackupData(backupData) {
  if (!confirmRestoreBackup()) return;

  setDiaryData(backupData.diary);
  setGoalData(backupData.goals);
  setHabitData(backupData.habits);
  setScheduleData(backupData.schedules);

  localStorage.setItem(
    TAB_STORAGE_KEY,
    JSON.stringify(backupData.tabOrder),
  );

  localStorage.setItem(
    DATE_SWITCH_MODE_KEY,
    backupData.settings.dateSwitchMode || "fixed",
  );

  localStorage.setItem(
    DATE_SWITCH_HOUR_KEY,
    backupData.settings.dateSwitchHour || "4",
  );

  resetAfterRestore();
  alert("バックアップを復元しました。");
}

function resetAfterRestore() {
  tabOrder = loadTabOrder();
  activeTabId = tabOrder[0].id;
  lastMainTabId = activeTabId;

  selectedPastDateKey = null;
  selectedHabitIndex = null;
  editingHabitIndex = null;

  isGoalDeleteMode = false;
  isGoalSortMode = false;
  isGoalColorMode = false;
  isScheduleDoneDeleteMode = false;

  habitCalendarMonthOffset = 0;
  pastDiaryCalendarMonthOffset = 0;
  isPastDiaryCalendarOpen = false;

  closeSwipeActions();
  resetGoalModes();

  renderTabs();
  renderPanels();
  renderTodayDiary();
  renderPastDateButtons();
  renderPastDiaryCalendar();
  renderMonthSelect();
  renderGoalList();
  renderHabitList();
  renderScheduleList();
  applyDateSwitchSettingsToUI();
}
