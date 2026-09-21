import { CATEGORIES, MODULE_ID, MODULE_TITLE } from "../constants.js";
import { AudioService } from "../services/audio-service.js";
import { DiscoveryService } from "../services/discovery-service.js";
import { SourceService } from "../services/source-service.js";
import { ItemInspector } from "./item-inspector.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class NazumiCompendium extends HandlebarsApplicationMixin(ApplicationV2) {
  static instance = null;

  static DEFAULT_OPTIONS = {
    id: "nazumi-compendium-app",
    tag: "div",
    classes: ["nazumi-compendium", "nazumi-fullscreen-app"],
    window: {
      frame: false,
      positioned: false
    },
    actions: {
      closeApp: NazumiCompendium.closeApp,
      selectCategory: NazumiCompendium.selectCategory,
      selectItem: NazumiCompendium.selectItem,
      inspectItem: NazumiCompendium.inspectItem,
      refreshSource: NazumiCompendium.refreshSource
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/compendium.hbs`
    }
  };

  constructor(options = {}) {
    super(options);
    this._category = "all";
    this._selectedKey = null;
    this._search = "";
    NazumiCompendium.instance = this;
  }

  static open() {
    const current = NazumiCompendium.instance;
    if (current?.rendered) {
      current.bringToFront?.();
      return current;
    }
    const app = current ?? new NazumiCompendium();
    app.render({ force: true });
    return app;
  }

  static async closeApp() {
    await this.close();
  }

  static async selectCategory(_event, target) {
    this._category = target.dataset.category ?? "all";
    this._selectedKey = null;
    AudioService.play("navigate");
    this.render({ force: true });
  }

  static async selectItem(_event, target) {
    const key = target.dataset.sourceKey;
    if (!key) return;
    this._selectedKey = key;
    AudioService.play("navigate");
    this.render({ force: true });
  }

  static async inspectItem(_event, target) {
    const key = target.dataset.sourceKey ?? this._selectedKey;
    if (!key) return;
    const state = DiscoveryService.getItemState(key);
    if (!game.user.isGM && !state.discovered) return;

    if (!game.user.isGM) await DiscoveryService.markViewed(key);
    AudioService.play("inspect");
    new ItemInspector({ sourceKey: key }).render({ force: true });
    this.render({ force: true });
  }

  static async refreshSource() {
    SourceService.clearCache();
    this._selectedKey = null;
    await this.render({ force: true });
    ui.notifications?.info("Nazumi Compendium: fonte recarregada.");
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    let entries = await SourceService.getEntries();
    const showLocked = game.settings.get(MODULE_ID, "showUndiscovered");

    const viewEntries = entries.map((entry) => this.#toViewEntry(entry));
    entries = viewEntries.filter((entry) => {
      if (!showLocked && !game.user.isGM && entry.locked) return false;
      if (this._category !== "all" && entry.category !== this._category) return false;
      return true;
    });

    if (!this._selectedKey || !entries.some((entry) => entry.sourceKey === this._selectedKey)) {
      this._selectedKey = entries[0]?.sourceKey ?? null;
    }

    const selected = entries.find((entry) => entry.sourceKey === this._selectedKey) ?? null;
    const allViewEntries = viewEntries.filter((entry) => showLocked || game.user.isGM || !entry.locked);
    const discoveredCount = viewEntries.filter((entry) => !entry.locked).length;

    const categories = CATEGORIES.map((category) => ({
      ...category,
      active: category.id === this._category,
      count: category.id === "all"
        ? allViewEntries.length
        : allViewEntries.filter((entry) => entry.category === category.id).length
    }));

    return {
      ...context,
      title: MODULE_TITLE,
      sourceLabel: this.#sourceLabel(),
      sourceIsDemo: !SourceService.sourceSetting || SourceService.sourceSetting === "demo",
      isGM: game.user.isGM,
      entries,
      categories,
      selected,
      selectedUnlocked: selected && !selected.locked,
      search: this._search,
      totalCount: viewEntries.length,
      discoveredCount
    };
  }

  #toViewEntry(entry) {
    const state = DiscoveryService.getItemState(entry.sourceKey);
    const unlocked = game.user.isGM || state.discovered === true;
    const locked = !unlocked;

    return {
      ...entry,
      locked,
      discovered: unlocked,
      isNew: !game.user.isGM && state.discovered === true && state.viewed !== true,
      displayName: locked ? "????????????" : entry.name,
      displaySubtitle: locked ? "Nao descoberto" : entry.subtitle,
      displayLore: locked ? "Este registro ainda nao foi descoberto." : entry.lore,
      displayMechanics: locked ? "" : entry.mechanics,
      displayRarity: locked ? "Desconhecido" : entry.rarityLabel,
      displayIcon: locked ? "fa-solid fa-question" : entry.icon,
      displayImg: locked ? null : entry.img,
      searchText: locked
        ? "nao descoberto desconhecido"
        : `${entry.name} ${entry.subtitle} ${entry.categoryLabel} ${entry.rarityLabel}`.toLocaleLowerCase(),
      selected: entry.sourceKey === this._selectedKey
    };
  }

  #sourceLabel() {
    const source = SourceService.sourceSetting;
    if (!source || source === "demo") return "Modo demonstracao";
    if (source.toLowerCase() === "world") return "Items do mundo";
    return source;
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    AudioService.play("open");
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const input = this.element.querySelector("[data-nazumi-search]");
    if (!input) return;

    input.value = this._search;
    const applyFilter = () => {
      this._search = input.value.trim().toLocaleLowerCase();
      const cards = this.element.querySelectorAll(".nazumi-item-card");
      for (const card of cards) {
        const haystack = card.dataset.search ?? "";
        card.hidden = Boolean(this._search && !haystack.includes(this._search));
      }
    };
    input.addEventListener("input", applyFilter);
    applyFilter();
  }

  _onClose(options) {
    AudioService.play("close");
    if (NazumiCompendium.instance === this) NazumiCompendium.instance = null;
    return super._onClose(options);
  }
}
