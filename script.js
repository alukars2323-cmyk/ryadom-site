// Код не использует сервер, cookies и localStorage.
// Данные посетителя живут только в памяти открытой страницы.
"use strict";
document.documentElement.classList.add("js");
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// 1. Мобильное меню.
const menu = $(".menu-toggle");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  $("#nav-links").classList.toggle("open", open);
});
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  $("#nav-links").classList.remove("open");
}
$$("#nav-links a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menu.focus();
  }
});

// 2. Подсказка по выбранному ощущению — без оценки здоровья.
const moods = {
  tired: ["Можно начать с короткого перерыва и решить, что сегодня допустимо перенести.", "Открыть паузу", "#self-help", "pause"],
  anxious: ["Попробуй на минуту заметить окружающие предметы и опору под ногами.", "Перейти к практике", "#self-help", "ground"],
  lonely: ["Подумай, кому можно написать. Не обязательно сразу объяснять всё.", "Подготовить разговор", "#help"],
  okay: ["Можно заметить, что сегодня тебя поддерживает, и оставить себе небольшую заметку.", "Записать мысль", "#journal", "write"],
};
$$("[data-mood]").forEach((button) => button.addEventListener("click", () => {
  $$("[data-mood]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  const [text, label, href, practice] = moods[button.dataset.mood];
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label + " →";
  if (practice) link.addEventListener("click", () => showPractice(practice));
  $("#mood-result").replaceChildren(document.createTextNode(text + " "), link);
}));

// 3. Поиск, фильтрация и избранное. Фильтры работают вместе с поиском.
const saved = new Set();
let activeFilter = "all";
const normalize = (text) => text.toLocaleLowerCase("ru").replaceAll("ё", "е").trim();
function filterTopics() {
  const words = normalize($("#search").value).split(/\s+/).filter(Boolean);
  let count = 0;
  $$(".topic").forEach((card) => {
    const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter || (activeFilter === "saved" && saved.has(card.id));
    const matchesSearch = words.every((word) => normalize(card.textContent).includes(word));
    card.hidden = !(matchesFilter && matchesSearch);
    if (!card.hidden) count++;
  });
  $("#topic-count").textContent = `Показано тем: ${count}`;
  $("#empty-topics").hidden = count !== 0;
  $("#saved-count").textContent = saved.size;
}
function chooseFilter(filter) {
  activeFilter = filter;
  $$("[data-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
  filterTopics();
}
$("#search").addEventListener("input", filterTopics);
$$("[data-filter]").forEach((button) => button.addEventListener("click", () => chooseFilter(button.dataset.filter)));
$("#reset-search").addEventListener("click", () => { $("#search").value = ""; chooseFilter("all"); });
$$("[data-save]").forEach((button) => button.addEventListener("click", () => {
  const id = button.dataset.save;
  saved.has(id) ? saved.delete(id) : saved.add(id);
  const isSaved = saved.has(id);
  button.setAttribute("aria-pressed", String(isSaved));
  button.textContent = isSaved ? "♥" : "♡";
  button.setAttribute("aria-label", `${isSaved ? "Убрать из избранного" : "Добавить в избранное"}: ${button.closest("article").querySelector("h3").textContent}`);
  // Если карточка исчезнет из текущего фильтра, фокус не потеряется.
  if (!isSaved && activeFilter === "saved") $('[data-filter="saved"]').focus();
  filterTopics();
  notify(isSaved ? "Тема добавлена в избранное" : "Тема убрана из избранного");
}));

// 4. Переключение упражнений.
function showPractice(name) {
  $$("[data-practice]").forEach((button) => {
    const selected = button.dataset.practice === name;
    button.setAttribute("aria-pressed", String(selected));
    $(`#practice-${button.dataset.practice}`).hidden = !selected;
  });
  // Таймер не продолжает отсчёт незаметно в скрытой панели.
  if (name !== "pause" && timerId !== null) pauseTimer();
}
$$("[data-practice]").forEach((button) => button.addEventListener("click", () => showPractice(button.dataset.practice)));
function revealHashTarget() {
  const hash = location.hash;
  if (hash === "#journal") showPractice("write");
  if (hash === "#first-meeting") $("#first-meeting").open = true;
  const topic = $$(".topic").find((card) => `#${card.id}` === hash);
  if (topic) {
    $("#search").value = "";
    chooseFilter("all");
    topic.querySelector("details").open = true;
  }
}
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#journal"]');
  if (link) showPractice("write");
});
window.addEventListener("hashchange", revealHashTarget);

// 5. Пошаговая практика.
const groundSteps = [
  ["Почувствуй опору", "Устройся так, как удобно. Заметь, как стопы касаются пола или тело опирается на стул. Глаза можно оставить открытыми."],
  ["Посмотри вокруг", "Найди три предмета вокруг себя. Отметь про себя их цвет, форму или размер. Не нужно искать что-то особенное."],
  ["Прислушайся", "Если тебе комфортно, заметь один или два окружающих звука. Если вокруг тихо или этот шаг не подходит, просто переходи дальше."],
  ["Заметь прикосновение", "Обрати внимание на контакт ладони с тканью, столом или другой удобной поверхностью. Что ты замечаешь: тепло, прохладу, мягкость?"],
  ["Выбери, что дальше", "Посмотри, что тебе сейчас нужно: ещё немного посидеть, выпить воды, вернуться к делу или поговорить с кем-то. Не обязательно чувствовать себя иначе после упражнения."],
];
let groundStep = 0;
function renderGround() {
  $("#ground-title").textContent = groundSteps[groundStep][0];
  $("#ground-text").textContent = groundSteps[groundStep][1];
  $("#ground-counter").textContent = `ШАГ ${groundStep + 1} ИЗ ${groundSteps.length}`;
  $("#ground-back").disabled = groundStep === 0;
  $("#ground-next").textContent = groundStep === groundSteps.length - 1 ? "Начать сначала ↻" : "Следующий шаг →";
  $$(".step-dots i").forEach((dot, index) => dot.classList.toggle("active", index === groundStep));
  $("#ground-title").focus({ preventScroll: true });
}
$("#ground-next").addEventListener("click", () => { groundStep = (groundStep + 1) % groundSteps.length; renderGround(); });
$("#ground-back").addEventListener("click", () => { groundStep = Math.max(0, groundStep - 1); renderGround(); });

// 6. Таймер использует конечное время, а не подсчёт вызовов setInterval.
let duration = 120;
let remaining = duration;
let deadline = 0;
let timerId = null;
function renderTimer() {
  $("#clock").textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}
function clearTimer() {
  clearInterval(timerId);
  timerId = null;
  $("#practice-pause").classList.remove("timer-running");
}
function pauseTimer() {
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  clearTimer();
  renderTimer();
  $("#timer-toggle").textContent = remaining ? "Продолжить" : "Ещё одна пауза";
  $("#timer-status").textContent = remaining ? "Таймер на паузе. Продолжай, когда захочешь." : "Время паузы закончилось. Можно выбрать следующий шаг.";
}
function resetTimer() {
  clearTimer();
  remaining = duration;
  renderTimer();
  $("#timer-toggle").textContent = "Начать паузу";
  $("#timer-status").textContent = "Таймер завершится без звука.";
}
$("#timer-toggle").addEventListener("click", () => {
  if (timerId !== null) { pauseTimer(); return; }
  if (remaining === 0) remaining = duration;
  deadline = Date.now() + remaining * 1000;
  $("#timer-toggle").textContent = "Приостановить";
  $("#timer-status").textContent = "Можно ненадолго отложить дела. Таймер идёт.";
  $("#practice-pause").classList.add("timer-running");
  timerId = setInterval(() => {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    renderTimer();
    if (remaining === 0) {
      clearTimer();
      $("#timer-toggle").textContent = "Ещё одна пауза";
      $("#timer-status").textContent = "Время паузы закончилось. Реши, готов ли ты вернуться к делам.";
    }
  }, 200);
});
$("#timer-reset").addEventListener("click", resetTimer);
$$("[data-duration]").forEach((button) => button.addEventListener("click", () => {
  duration = Number(button.dataset.duration);
  $$("[data-duration]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  resetTimer();
}));

// 7. Заметки и скачивание. Пользовательский текст выводим через textContent.
function downloadText(filename, text) {
  const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
$("#thoughts").addEventListener("input", () => {
  $("#chars").textContent = `${$("#thoughts").value.length} / 5000`;
  $("#note-status").textContent = "Текст находится только на этой странице. Скачай заметку, чтобы сохранить её перед закрытием.";
});
$("#download-note").addEventListener("click", () => {
  const text = $("#thoughts").value.trim();
  if (!text) { $("#note-status").textContent = "Сначала напиши хотя бы несколько слов."; $("#thoughts").focus(); return; }
  downloadText("ryadom-note.txt", `Рядом — заметка для себя\n\n${text}\n`);
  $("#note-status").textContent = "Файл подготовлен для скачивания. Сохрани его в подходящем месте на своём устройстве.";
});
let lastNote = "";
$("#clear-note").addEventListener("click", () => {
  if (lastNote && !$("#thoughts").value) {
    $("#thoughts").value = lastNote;
    lastNote = "";
    $("#clear-note").textContent = "Очистить";
    $("#note-status").textContent = "Текст восстановлен.";
  } else {
    lastNote = $("#thoughts").value;
    $("#thoughts").value = "";
    $("#clear-note").textContent = lastNote ? "Вернуть текст" : "Очистить";
    $("#note-status").textContent = lastNote ? "Заметка очищена. Можно вернуть текст этой же кнопкой." : "Заметка уже пустая.";
  }
  $("#chars").textContent = `${$("#thoughts").value.length} / 5000`;
  $("#thoughts").focus();
});
const prompts = [
  "Если бы друг оказался в похожей ситуации, что бы я ему сказал?",
  "Что сегодня забрало силы, а что хотя бы немного поддержало?",
  "Что в этой ситуации я знаю точно, а что пока только предполагаю?",
  "Какую помощь я хотел бы попросить и у кого?",
  "Какое дело можно отложить, чтобы освободить немного времени для себя?",
];
let promptIndex = 0;
$("#new-prompt").addEventListener("click", () => {
  promptIndex = (promptIndex + 1) % prompts.length;
  $("#writing-prompt").textContent = prompts[promptIndex];
});

// 8. Два мини-теста: результаты — идеи действий, а не диагнозы.
const needAdvice = {
  plan: ["План", "Запиши одну задачу и самый простой первый шаг. Например, открыть файл и добавить заголовок.", "#plan"],
  rest: ["Отдых", "Выдели время на перерыв и подумай, какое необязательное дело можно перенести.", "#self-help"],
  talk: ["Разговор", "Напиши человеку, которому доверяешь, и спроси, удобно ли ему немного тебя выслушать.", "#help"],
};
function fillResult(form, title, items) {
  const result = form.querySelector(".quiz-result");
  const heading = document.createElement("strong");
  heading.textContent = title;
  const list = document.createElement("ul");
  items.forEach(([text, href, label]) => {
    const item = document.createElement("li");
    item.textContent = text;
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label + " →";
      if (label === "Отдых") link.addEventListener("click", () => showPractice("pause"));
      item.append(document.createElement("br"), link);
    }
    list.append(item);
  });
  const note = document.createElement("p");
  note.className = "small";
  note.textContent = "Это подсказки для размышления, а не оценка здоровья. Выбери только то, что подходит тебе.";
  result.replaceChildren(heading, list, note);
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: "nearest", behavior: "auto" });
}
$("#needs").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const scores = { plan: 0, rest: 0, talk: 0 };
  for (let i = 0; i < 3; i++) scores[data.get(`n${i}`)]++;
  const highest = Math.max(...Object.values(scores));
  const choices = Object.keys(scores).filter((key) => scores[key] === highest);
  fillResult(event.currentTarget, choices.length > 1 ? "Подойдут несколько направлений. Выбери одно:" : "Можно начать с такого шага:", choices.map((key) => {
    const [label, text, href] = needAdvice[key];
    return [text, href, label];
  }));
});
$("#rest").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const tips = ["Запланируй короткий перерыв между двумя делами.", "Выдели немного времени для занятия, которое тебе приятно.", "Посмотри, какие вечерние дела можно перенести, чтобы освободить время на сон.", "Подумай, кому можно написать или к какому специалисту обратиться за поддержкой."];
  const items = tips.filter((_, i) => data.get(`r${i}`) !== "yes").map((tip) => [tip]);
  fillResult(event.currentTarget, items.length ? "Вот чему можно уделить внимание:" : "В твоих ответах есть место для отдыха и поддержки.", items.length ? items : [["Выбери одну из уже подходящих привычек и подумай, как сохранить для неё время."]]);
});
$$(".quiz").forEach((form) => {
  const clear = () => { const result = form.querySelector(".quiz-result"); result.hidden = true; result.replaceChildren(); };
  form.addEventListener("reset", clear);
  form.addEventListener("change", clear);
});

// 9. Список небольших действий: добавление, удаление, прогресс, экспорт.
let tasks = [];
let taskId = 0;
function renderPlan() {
  const list = $("#plan-list");
  list.replaceChildren();
  tasks.forEach((task) => {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => { task.done = checkbox.checked; updateProgress(); });
    const text = document.createElement("span");
    text.textContent = task.text;
    label.append(checkbox, text);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-task";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Удалить действие: " + task.text);
    remove.addEventListener("click", () => { tasks = tasks.filter((t) => t.id !== task.id); renderPlan(); $("#plan-input").focus(); });
    item.append(label, remove);
    list.append(item);
  });
  updateProgress();
}
function updateProgress() {
  const done = tasks.filter((task) => task.done).length;
  $("#plan-progress").max = tasks.length || 1;
  $("#plan-progress").value = done;
  $("#plan-empty").hidden = tasks.length > 0;
  $("#plan-status").textContent = tasks.length ? `Отмечено: ${done} из ${tasks.length}. План можно менять в любой момент.` : "Выбери одно посильное действие.";
}
function addTask(text) {
  const clean = text.trim();
  if (!clean) { notify("Напиши действие перед добавлением."); return false; }
  if (tasks.length >= 12) { notify("В плане уже 12 действий. Можно удалить ненужное."); return false; }
  if (tasks.some((task) => normalize(task.text) === normalize(clean))) { notify("Это действие уже есть в плане."); return false; }
  tasks.push({ id: ++taskId, text: clean.slice(0, 120), done: false });
  renderPlan();
  return true;
}
$("#plan-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (addTask($("#plan-input").value)) $("#plan-input").value = "";
  $("#plan-input").focus();
});
$$("[data-add]").forEach((button) => button.addEventListener("click", () => addTask(button.dataset.add)));
$("#download-plan").addEventListener("click", () => {
  if (!tasks.length) { notify("Сначала добавь в план хотя бы одно действие."); return; }
  downloadText("ryadom-plan.txt", "Рядом — мой план на сегодня\n\n" + tasks.map((task) => `${task.done ? "[x]" : "[ ]"} ${task.text}`).join("\n") + "\n\nЭто не список обязательств. План можно менять.\n");
});

// 10. Шаблон сообщения. Копирование — только по нажатию пользователя.
$("#message-template").addEventListener("click", () => {
  $("#message-box").hidden = false;
  $("#support-message").focus();
});
$("#copy-message").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText($("#support-message").value);
    $("#copy-status").textContent = "Скопировано. Вставь текст в выбранный мессенджер и отправь, если захочешь.";
  } catch {
    $("#support-message").focus();
    $("#support-message").select();
    $("#copy-status").textContent = "Браузер не разрешил автоматическое копирование. Текст выделен: нажми Ctrl+C (на Mac — Cmd+C).";
  }
});
let toastTimeout;
function notify(text) {
  clearTimeout(toastTimeout);
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  toastTimeout = setTimeout(() => { $("#toast").hidden = true; }, 3500);
}
revealHashTarget();


// 11. Обратная связь. Данные остаются на устройстве: без сервера отправка невозможна.
const feedbackForm = $("#feedback-form");
const feedbackMessage = $("#feedback-message");
const feedbackPreview = $("#feedback-preview");
const feedbackOutput = $("#feedback-output");
feedbackMessage.addEventListener("input", () => {
  $("#feedback-count").textContent = `${feedbackMessage.value.length} / 1200`;
  feedbackPreview.hidden = true;
});
feedbackForm.addEventListener("change", () => { feedbackPreview.hidden = true; });
feedbackForm.addEventListener("reset", () => {
  feedbackPreview.hidden = true;
  $("#feedback-count").textContent = "0 / 1200";
});
feedbackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!feedbackForm.reportValidity()) return;
  const kind = $("#feedback-kind").value;
  const rating = feedbackForm.querySelector('input[name="rating"]:checked')?.value;
  const message = feedbackMessage.value.trim();
  if (message.length < 10) {
    feedbackMessage.setCustomValidity("Напиши хотя бы 10 символов.");
    feedbackMessage.reportValidity();
    feedbackMessage.setCustomValidity("");
    return;
  }
  feedbackOutput.value = `Отзыв о сайте «Рядом»\nТема: ${kind}\nОценка удобства: ${rating ? rating + " из 5" : "не указана"}\n\n${message}\n`;
  feedbackPreview.hidden = false;
  $("#feedback-status").textContent = "Отзыв подготовлен, но не отправлен.";
  feedbackPreview.focus({preventScroll:true});
  feedbackPreview.scrollIntoView({block:"nearest",behavior:"auto"});
});
$("#feedback-copy").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) throw new Error("Нет доступа к буферу обмена");
    await navigator.clipboard.writeText(feedbackOutput.value);
    $("#feedback-status").textContent = "Текст скопирован. Отправь его автору удобным способом.";
  } catch {
    feedbackOutput.focus(); feedbackOutput.select();
    $("#feedback-status").textContent = "Текст выделен. Нажми Ctrl+C (или Cmd+C на Mac), чтобы скопировать.";
  }
});
$("#feedback-download").addEventListener("click", () => downloadText("ryadom-feedback.txt", feedbackOutput.value));
