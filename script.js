// JavaScript — поиск, тесты, таймер и работа с заметками.

const $ = (s) => document.querySelector(s);
// Поиск: скрываем карточки, которые не содержат введённые слова.
$("#search").addEventListener("input", (e) => {
  const q = e.target.value.toLocaleLowerCase("ru").trim();
  let n = 0;
  document.querySelectorAll(".topic").forEach((c) => {
    c.hidden = !c.textContent.toLocaleLowerCase("ru").includes(q);
    if (!c.hidden) n++;
  });
  $("#count").textContent = "Показано тем: " + n;
  $("#empty").hidden = n !== 0;
});
// Вывод текста результата теста.
function result(form, txt) {
  form.querySelector(".result").textContent = txt;
}
// Первый тест: выбираем действие по ответам пользователя.
$("#needs").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target),
    scores = [0, 0, 0];
  for (let i = 0; i < 3; i++) scores[Number(d.get("n" + i))]++;
  const advice = [
    "План: запиши одну задачу и самый простой первый шаг. Например: открыть конспект и прочитать один абзац.",
    "Пауза: попробуй отложить дела на пару минут. Ниже есть таймер; позже можно выделить время на полноценный отдых.",
    "Поддержка: напиши человеку, которому доверяешь: «У тебя есть время меня выслушать?»",
  ];
  let max = Math.max(...scores);
  let chosen = scores
    .map((s, i) => (s === max ? advice[i] : null))
    .filter(Boolean);
  result(
    e.target,
    (chosen.length > 1
      ? "Ответы указывают на несколько подходящих шагов. Выбери один. "
      : "По твоим ответам можно начать с такого действия: ") +
      chosen.join(" ") +
      " Это подсказка для выбора, а не оценка здоровья.",
  );
});
// Второй тест: предлагаем идеи для привычек отдыха.
$("#rest").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const tips = [
    "Выдели небольшой перерыв между двумя задачами.",
    "Оставь немного времени для приятного занятия.",
    "Подумай, как освободить время для сна и уменьшить вечернюю нагрузку.",
    "Подумай, кому можно написать или где найти профессиональную поддержку.",
  ];
  let chosen = tips.filter((_, i) => d.get("r" + i) !== "yes");
  result(
    e.target,
    chosen.length
      ? "Вот привычки, которым можно уделить внимание: " +
          chosen.join(" ") +
          " Выбери один посильный шаг на сегодня."
      : "В твоих ответах есть место для отдыха и поддержки. Подумай, какую из этих привычек тебе хочется сохранить. Ответы не позволяют оценить здоровье.",
  );
});
for (const f of document.querySelectorAll("form")) {
  f.addEventListener("reset", () => result(f, ""));
  f.addEventListener("change", () => result(f, ""));
}
// Таймер: отсчитываем две минуты, поддерживаем остановку и сброс.
let remaining = 120,
  interval = null;
function renderClock() {
  $("#clock").textContent =
    String(Math.floor(remaining / 60)).padStart(2, "0") +
    ":" +
    String(remaining % 60).padStart(2, "0");
}
function stop() {
  clearInterval(interval);
  interval = null;
}
$("#start").addEventListener("click", () => {
  if (interval) {
    stop();
    $("#start").textContent = "Продолжить";
    $("#timer-status").textContent = "Пауза остановлена.";
    return;
  }
  if (!remaining) remaining = 120;
  renderClock();
  const end = Date.now() + remaining * 1000;
  $("#start").textContent = "Остановить";
  $("#timer-status").textContent = "Можно спокойно отвлечься от задачи.";
  interval = setInterval(() => {
    remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    renderClock();
    if (!remaining) {
      stop();
      $("#start").textContent = "Ещё одна пауза";
      $("#timer-status").textContent =
        "Две минуты прошли. Реши, готов ли ты вернуться к делам.";
    }
  }, 250);
});
$("#reset-timer").addEventListener("click", () => {
  stop();
  remaining = 120;
  renderClock();
  $("#start").textContent = "Начать паузу";
  $("#timer-status").textContent = "Можно остановиться в любой момент.";
});
// Заметки: считаем символы. На сервер ничего не отправляется.
$("#thoughts").addEventListener("input", () => {
  $("#chars").textContent = $("#thoughts").value.length + " / 3000";
});
$("#clear").addEventListener("click", () => {
  $("#thoughts").value = "";
  $("#chars").textContent = "0 / 3000";
  $("#thoughts").focus();
});
document.querySelectorAll(".plan").forEach((c) =>
  c.addEventListener("change", () => {
    $("#plan-status").textContent =
      "Выбрано действий: " +
      document.querySelectorAll(".plan:checked").length +
      " из 3. Это не список обязательств.";
  }),
);
