import { MODULE_ID } from "../constants.js";
import { NazumiCompendium } from "../applications/compendium-app.js";

const LEGACY_BUTTON_ID = "nazumi-compendium-launcher";
const TOOL_NAME = `${MODULE_ID}-open`;

export function addNazumiSceneControl(controls) {
  const tokenControls = controls.tokens;
  if (!tokenControls?.tools) {
    console.warn(`${MODULE_ID} | Controles de tokens indisponíveis; o atalho Alt+C continua ativo.`);
    return;
  }

  if (!game.settings.get(MODULE_ID, "showLauncher")) {
    delete tokenControls.tools[TOOL_NAME];
    return;
  }

  tokenControls.tools[TOOL_NAME] = {
    name: TOOL_NAME,
    title: "NAZUMI.Open",
    icon: "fa-solid fa-book-open",
    order: 100,
    button: true,
    visible: true,
    onChange: () => NazumiCompendium.open()
  };
}

export function refreshNazumiSceneControl() {
  // Remove o launcher usado pelas versões anteriores sem exigir recarga.
  document.getElementById(LEGACY_BUTTON_ID)?.remove();
  if (ui.controls?.rendered) ui.controls.render({ force: true, reset: true });
}
