export const MODULE_ID = "nazumi-compendium";
export const MODULE_TITLE = "Compêndio de Nazumi";
export const SOCKET_NAME = `module.${MODULE_ID}`;

export const CATEGORIES = [
  { id: "all", label: "Todos", icon: "fa-solid fa-compass" },
  { id: "weapons", label: "Armas", icon: "fa-solid fa-khanda" },
  { id: "armor", label: "Armaduras", icon: "fa-solid fa-shield-halved" },
  { id: "talismans", label: "Talismas", icon: "fa-solid fa-diamond" },
  { id: "consumables", label: "Consumíveis", icon: "fa-solid fa-flask" },
  { id: "materials", label: "Materiais", icon: "fa-solid fa-gem" },
  { id: "key-items", label: "Itens-chave", icon: "fa-solid fa-key" },
  { id: "relics", label: "Relíquias", icon: "fa-solid fa-feather-pointed" },
  { id: "lore", label: "Conhecimento", icon: "fa-solid fa-book-open" }
];

export const RARITIES = {
  common: { label: "Comum", rank: 10 },
  uncommon: { label: "Incomum", rank: 20 },
  rare: { label: "Raro", rank: 30 },
  epic: { label: "Épico", rank: 40 },
  legendary: { label: "Lendário", rank: 50 }
};
