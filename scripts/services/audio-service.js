import { MODULE_ID } from "../constants.js";

const FILES = {
  open: "open.wav",
  close: "close.wav",
  navigate: "navigate.wav",
  discover: "discover.wav",
  inspect: "inspect.wav"
};

export class AudioService {
  static async play(event) {
    if (!game.settings.get(MODULE_ID, "audioEnabled")) return;
    const file = FILES[event];
    if (!file) return;
    const volume = Number(game.settings.get(MODULE_ID, "audioVolume") ?? 0.4);
    try {
      const sound = await game.audio.play(`modules/${MODULE_ID}/assets/audio/${file}`);
      if (sound && Number.isFinite(volume)) {
        sound.volume = Math.max(0, Math.min(1, volume));
      }
    } catch (error) {
      console.warn(`${MODULE_ID} | Falha ao reproduzir audio '${event}'.`, error);
    }
  }
}
