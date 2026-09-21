import { MODULE_ID } from "../constants.js";
import { AudioService } from "../services/audio-service.js";
import { SourceService } from "../services/source-service.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class DiscoveryPopup extends HandlebarsApplicationMixin(ApplicationV2) {
  static active = null;

  static DEFAULT_OPTIONS = {
    id: "nazumi-discovery-popup",
    tag: "div",
    classes: ["nazumi-discovery-popup", "nazumi-overlay-app"],
    window: {
      frame: false,
      positioned: false
    },
    actions: {
      closePopup: DiscoveryPopup.closePopup
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/discovery-popup.hbs`
    }
  };

  constructor({ sourceKey, ...options } = {}) {
    super(options);
    this.sourceKey = sourceKey;
    this._timer = null;
    DiscoveryPopup.active = this;
  }

  static async show(sourceKey) {
    if (DiscoveryPopup.active?.rendered) await DiscoveryPopup.active.close();
    const popup = new DiscoveryPopup({ sourceKey });
    popup.render({ force: true });
    return popup;
  }

  static async closePopup() {
    await this.close();
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const entry = await SourceService.getEntry(this.sourceKey);
    return { ...context, entry };
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    AudioService.play("discover");
    this._timer = window.setTimeout(() => this.close(), 4800);
  }

  _onClose(options) {
    if (this._timer) window.clearTimeout(this._timer);
    if (DiscoveryPopup.active === this) DiscoveryPopup.active = null;
    return super._onClose(options);
  }
}
