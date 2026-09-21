import { MODULE_ID } from "../constants.js";
import { NazumiCompendium } from "../applications/compendium-app.js";

const BUTTON_ID = "nazumi-compendium-launcher";

export function ensureLauncherButton() {
  const enabled = game.settings.get(MODULE_ID, "showLauncher");
  const existing = document.getElementById(BUTTON_ID);

  if (!enabled) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.className = "nazumi-launcher-button";
  button.title = "Abrir Compendio de Nazumi (Alt+C)";
  button.setAttribute("aria-label", "Abrir Compendio de Nazumi");
  button.innerHTML = '<i class="fa-solid fa-book-open"></i><span>COMPENDIO</span>';
  button.addEventListener("click", () => NazumiCompendium.open());
  document.body.append(button);
}
