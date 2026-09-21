import { MODULE_ID } from "../constants.js";
import { MetadataService } from "./metadata-service.js";

export class SourceService {
  static #cache = null;
  static #cacheKey = null;

  static clearCache() {
    this.#cache = null;
    this.#cacheKey = null;
  }

  static get sourceSetting() {
    return String(game.settings.get(MODULE_ID, "sourcePack") ?? "").trim();
  }

  static async getEntries({ refresh = false } = {}) {
    const source = this.sourceSetting || "demo";
    if (!refresh && this.#cache && this.#cacheKey === source) return this.#cache;

    let entries;
    if (source === "demo") entries = await this.#loadDemo();
    else if (source.toLowerCase() === "world") entries = this.#loadWorldItems();
    else entries = await this.#loadCompendium(source);

    this.#cache = entries.sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name));
    this.#cacheKey = source;
    return this.#cache;
  }

  static async #loadDemo() {
    const response = await fetch(`modules/${MODULE_ID}/data/demo-items.json`);
    if (!response.ok) throw new Error(`Nazumi Compendium: falha ao carregar demo-items.json (${response.status})`);
    const data = await response.json();
    return data.map((raw) => MetadataService.fromDemo(raw));
  }

  static #loadWorldItems() {
    return game.items
      .filter((item) => item.getFlag(MODULE_ID, "enabled") === true)
      .map((item) => MetadataService.fromItem(item));
  }

  static async #loadCompendium(collectionId) {
    const pack = game.packs.get(collectionId);
    if (!pack) {
      ui.notifications?.warn(`Nazumi Compendium: o pack '${collectionId}' nao foi encontrado. Exibindo demo.`);
      return this.#loadDemo();
    }
    if (pack.documentName !== "Item") {
      ui.notifications?.error(`Nazumi Compendium: '${collectionId}' nao e um Compendium de Items.`);
      return [];
    }
    try {
      const documents = await pack.getDocuments();
      return documents.map((item) => MetadataService.fromItem(item));
    } catch (error) {
      console.error(`${MODULE_ID} | Falha ao ler o Compendium '${collectionId}'.`, error);
      ui.notifications?.error(`Nazumi Compendium: nao foi possivel ler '${collectionId}'. Verifique as permissoes do pack.`);
      return [];
    }
  }

  static async getEntry(sourceKey) {
    const entries = await this.getEntries();
    return entries.find((entry) => entry.sourceKey === sourceKey) ?? null;
  }

  static async findByName(name) {
    const normalized = String(name ?? "").trim().toLocaleLowerCase();
    if (!normalized) return null;
    const entries = await this.getEntries();
    return entries.find((entry) => entry.name.toLocaleLowerCase() === normalized) ?? null;
  }

  static async resolveSourceKeyFromItem(item) {
    const explicit = item.getFlag?.(MODULE_ID, "sourceKey");
    if (explicit) return explicit;

    const origin = item.getFlag?.("core", "sourceId");
    const entries = await this.getEntries();
    if (origin && entries.some((entry) => entry.sourceKey === origin)) return origin;

    const byUuid = entries.find((entry) => entry.sourceKey === item.uuid);
    if (byUuid) return byUuid.sourceKey;

    const byIdentity = entries.find((entry) => entry.name === item.name && entry.type === item.type);
    return byIdentity?.sourceKey ?? null;
  }
}
