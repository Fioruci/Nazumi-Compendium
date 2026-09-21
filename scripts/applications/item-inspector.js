import { MODULE_ID } from "../constants.js";
import { AudioService } from "../services/audio-service.js";
import { DiscoveryService } from "../services/discovery-service.js";
import { SourceService } from "../services/source-service.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ItemInspector extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "nazumi-item-inspector",
    tag: "div",
    classes: ["nazumi-inspector", "nazumi-overlay-app"],
    window: {
      frame: false,
      positioned: false
    },
    actions: {
      closeInspector: ItemInspector.closeInspector,
      toggleUserDiscovery: ItemInspector.toggleUserDiscovery,
      revealAll: ItemInspector.revealAll,
      hideAll: ItemInspector.hideAll,
      openSourceItem: ItemInspector.openSourceItem
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/inspector.hbs`
    }
  };

  constructor({ sourceKey, ...options } = {}) {
    super(options);
    this.sourceKey = sourceKey;
  }

  static async closeInspector() {
    await this.close();
  }

  static async toggleUserDiscovery(_event, target) {
    if (!game.user.isGM) return;
    const control = target.closest?.("[data-user-id]") ?? target;
    const userId = control.dataset.userId;
    const user = game.users.get(userId);
    if (!user) return;

    control.disabled = true;
    control.setAttribute("aria-busy", "true");
    try {
      if (DiscoveryService.isDiscovered(this.sourceKey, user)) {
        await DiscoveryService.undiscover(this.sourceKey, userId);
      } else {
        await DiscoveryService.discover(this.sourceKey, userId, { popup: true });
      }
      AudioService.play("navigate");
      await this.render({ force: true });
    } catch (error) {
      console.error(`${MODULE_ID} | Falha ao alterar a descoberta para '${userId}'.`, error);
      ui.notifications?.error(`Nazumi Compendium: nao foi possivel atualizar ${user.name}.`);
      control.disabled = false;
      control.removeAttribute("aria-busy");
    }
  }

  static async revealAll() {
    if (!game.user.isGM) return;
    try {
      await DiscoveryService.revealAllPlayers(this.sourceKey);
      await this.render({ force: true });
    } catch (error) {
      console.error(`${MODULE_ID} | Falha ao revelar o item para todos.`, error);
      ui.notifications?.error("Nazumi Compendium: nao foi possivel revelar o item para todos.");
    }
  }

  static async hideAll() {
    if (!game.user.isGM) return;
    try {
      await DiscoveryService.hideFromAllPlayers(this.sourceKey);
      await this.render({ force: true });
    } catch (error) {
      console.error(`${MODULE_ID} | Falha ao ocultar o item de todos.`, error);
      ui.notifications?.error("Nazumi Compendium: nao foi possivel ocultar o item de todos.");
    }
  }

  static async openSourceItem() {
    if (!game.user.isGM) return;
    const entry = await SourceService.getEntry(this.sourceKey);
    if (!entry?.uuid) return;
    const doc = await fromUuid(entry.uuid);
    if (!doc?.sheet) return;
    try {
      doc.sheet.render({ force: true });
    } catch (_error) {
      doc.sheet.render(true);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const entry = await SourceService.getEntry(this.sourceKey);
    if (!entry) return { ...context, missing: true };

    const state = DiscoveryService.getItemState(this.sourceKey);
    const unlocked = game.user.isGM || state.discovered === true;
    const players = game.user.isGM
      ? game.users
          .filter((user) => !user.isGM)
          .map((user) => ({
            id: user.id,
            name: user.name,
            active: user.active,
            discovered: DiscoveryService.isDiscovered(this.sourceKey, user)
          }))
      : [];

    return {
      ...context,
      missing: false,
      isGM: game.user.isGM,
      unlocked,
      entry: unlocked
        ? entry
        : {
            ...entry,
            name: "????????????",
            subtitle: "Nao descoberto",
            rarityLabel: "Desconhecido",
            lore: "Este registro ainda nao foi descoberto.",
            mechanics: "",
            img: null,
            icon: "fa-solid fa-question"
          },
      players,
      hasSourceDocument: Boolean(entry.uuid)
    };
  }
}
