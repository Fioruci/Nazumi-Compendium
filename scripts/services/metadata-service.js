import { CATEGORIES, MODULE_ID, RARITIES } from "../constants.js";

const TYPE_TO_CATEGORY = {
  weapon: "weapons",
  equipment: "armor",
  armor: "armor",
  consumable: "consumables",
  loot: "materials",
  tool: "materials",
  container: "key-items",
  feat: "talismans"
};

function stripHtml(value = "") {
  const div = document.createElement("div");
  div.innerHTML = String(value ?? "");
  return (div.textContent || div.innerText || "").trim();
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim().length) ?? "";
}

export class MetadataService {
  static categoryLabel(id) {
    return CATEGORIES.find((category) => category.id === id)?.label ?? "Outros";
  }

  static inferCategory(item) {
    const explicit = item.getFlag?.(MODULE_ID, "category");
    if (explicit) return explicit;
    return TYPE_TO_CATEGORY[item.type] ?? "relics";
  }

  static fromItem(item) {
    const category = this.inferCategory(item);
    const rarityKey = item.getFlag?.(MODULE_ID, "rarity") ?? "common";
    const rarity = RARITIES[rarityKey] ?? RARITIES.common;
    const systemDescription = foundry.utils.getProperty(item, "system.description.value") ?? "";
    const mechanics = firstNonEmpty(
      item.getFlag?.(MODULE_ID, "mechanics"),
      systemDescription,
      "Sem descricao mecanica cadastrada."
    );
    const lore = firstNonEmpty(
      item.getFlag?.(MODULE_ID, "lore"),
      item.getFlag?.(MODULE_ID, "description"),
      "Nenhum registro adicional foi descoberto sobre este item."
    );

    return {
      sourceType: "item",
      sourceKey: item.uuid,
      uuid: item.uuid,
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img || null,
      icon: item.getFlag?.(MODULE_ID, "icon") ?? "fa-solid fa-diamond",
      category,
      categoryLabel: this.categoryLabel(category),
      subtitle: item.getFlag?.(MODULE_ID, "subtitle") ?? item.type ?? "Item",
      rarityKey,
      rarityLabel: rarity.label,
      rarityRank: rarity.rank,
      mechanics,
      mechanicsText: stripHtml(mechanics),
      lore,
      sort: Number(item.getFlag?.(MODULE_ID, "sort") ?? item.sort ?? 0),
      document: item
    };
  }

  static fromDemo(raw) {
    const rarity = RARITIES[raw.rarity] ?? RARITIES.common;
    return {
      sourceType: "demo",
      sourceKey: `demo:${raw.id}`,
      uuid: null,
      id: raw.id,
      name: raw.name,
      type: "demo",
      img: raw.img ?? null,
      icon: raw.icon ?? "fa-solid fa-diamond",
      category: raw.category ?? "relics",
      categoryLabel: this.categoryLabel(raw.category ?? "relics"),
      subtitle: raw.subtitle ?? "Item",
      rarityKey: raw.rarity ?? "common",
      rarityLabel: rarity.label,
      rarityRank: rarity.rank,
      mechanics: raw.mechanics ?? "",
      mechanicsText: stripHtml(raw.mechanics ?? ""),
      lore: raw.lore ?? "",
      sort: Number(raw.sort ?? 0),
      document: null
    };
  }
}
