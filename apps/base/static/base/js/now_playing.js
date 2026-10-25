const POLL_INTERVAL_MS = 15000;

const widget = document.getElementById("nowPlaying");

async function updateNowPlaying() {
  try {
    const response = await fetch(widget.dataset.url);
    if (!response.ok) return;
    render(await response.json());
  } catch (error) {
    // falha de rede: mantem o estado atual
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function render(track) {
  widget.replaceChildren();
  if (!track.is_playing) {
    widget.append(element("p", "now-playing-idle"));
    return;
  }

  const card = element("a", "now-playing-card");
  card.href = track.url || "#";
  card.target = "_blank";
  card.rel = "noopener";

  if (track.cover) {
    const cover = element("img", "now-playing-cover");
    cover.src = track.cover;
    cover.alt = track.album;
    card.append(cover);
  }

  const info = element("div", "now-playing-info");
  info.append(element("span", "now-playing-title", track.title));
  info.append(element("span", "now-playing-artist", track.artists));
  card.append(info);

  const bars = element("div", "now-playing-bars");
  bars.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) bars.append(element("span"));
  card.append(bars);

  widget.append(card);
}

updateNowPlaying();
setInterval(updateNowPlaying, POLL_INTERVAL_MS);
