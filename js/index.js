// Exercise list on the start page, built from the quizzes registered in
// window.QUIZZES by the word files loaded before this one (e.g. js/orte.js).

(() => {
  const list = document.getElementById("exercises");

  for (const quiz of Object.values(window.QUIZZES || {})) {
    const words = quiz.rounds.reduce((sum, r) => sum + r.words.length, 0);

    const link = document.createElement("a");
    link.className = "exercise";
    link.href = quiz.page;

    const inner = document.createElement("span");
    inner.className = "exercise-inner";

    const pic = document.createElement("span");
    pic.className = "pic";
    pic.setAttribute("aria-hidden", "true");
    pic.textContent = quiz.emoji || "";

    const text = document.createElement("span");
    text.className = "text";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = quiz.title;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = [quiz.description, quiz.rounds.length === 1 ? "1 Runde" : `${quiz.rounds.length} Runden`, `${words} Wörter`]
      .filter(Boolean)
      .join(" · ");
    text.append(name, meta);

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "›";

    inner.append(pic, text, arrow);
    link.append(inner);
    const item = document.createElement("li");
    item.append(link);
    list.append(item);
  }
})();
