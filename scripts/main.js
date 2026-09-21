import { MODULE_ID, SOCKET_NAME } from "./constants.js";
import { NazumiCompendium } from "./applications/compendium-app.js";
import { DiscoveryPopup } from "./applications/discovery-popup.js";
import { DiscoveryService } from "./services/discovery-service.js";
import { SourceService } from "./services/source-service.js";
import { ensureLauncherButton } from "./ui/launcher.js";

function registerSettings() {
  game.settings.register(MODULE_ID, "sourcePack", {
    name: "Fonte dos itens",
    hint: "Deixe vazio para o modo demonstracao. Informe 'world' para Items do mundo marcados com a flag enabled, ou o collection id de um Compendium de Items (ex.: meu-modulo.reliquias).",
    scope: "world",
    config: true,
    type: String,
    default: "",
    onChange: () => {
      SourceService.clearCache();
      NazumiCompendium.instance?.render({ force: true });
    }
  });

  game.settings.register(MODULE_ID, "showUndiscovered", {
    name: "Exibir slots nao descobertos",
    hint: "Quando ativo, jogadores veem registros bloqueados como ????????.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => NazumiCompendium.instance?.render({ force: true })
  });

  game.settings.register(MODULE_ID, "autoDiscoverInventory", {
    name: "Descobrir ao receber Item",
    hint: "Tenta desbloquear automaticamente a entrada quando um Item correspondente e criado no inventario de um Actor. Usa sourceId, sourceKey ou nome+tipo para encontrar a entrada.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "showLauncher", {
    name: "Exibir botao do Compendio",
    hint: "Mostra um botao discreto COMPENDIO na interface do Foundry.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => ensureLauncherButton()
  });

  game.settings.register(MODULE_ID, "audioEnabled", {
    name: "Sons da interface",
    hint: "Ativa os efeitos sonoros do Compendio neste navegador.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "audioVolume", {
    name: "Volume dos sons",
    hint: "Volume dos efeitos sonoros do Compendio.",
    scope: "client",
    config: true,
    type: Number,
    default: 0.38,
    range: {
      min: 0,
      max: 1,
      step: 0.05
    }
  });
}

function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "openCompendium", {
    name: "Abrir Compendio de Nazumi",
    hint: "Abre a interface principal do Compendio.",
    editable: [{ key: "KeyC", modifiers: ["ALT"] }],
    restricted: false,
    onDown: () => {
      NazumiCompendium.open();
      return true;
    }
  });
}

async function tagItem(uuid, metadata = {}) {
  if (!game.user.isGM) throw new Error("Nazumi Compendium: apenas o GM pode configurar metadados de Items.");
  const item = await fromUuid(uuid);
  if (!item || item.documentName !== "Item") throw new Error(`Nazumi Compendium: '${uuid}' nao e um Item valido.`);

  const allowed = ["enabled", "category", "rarity", "subtitle", "lore", "mechanics", "icon", "sort", "sourceKey"];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      await item.setFlag(MODULE_ID, key, metadata[key]);
    }
  }
  SourceService.clearCache();
  return item;
}

async function discover(sourceKey, userId = game.user.id, { popup = true } = {}) {
  const user = game.users.get(userId);
  if (!user) throw new Error(`Nazumi Compendium: usuario '${userId}' nao encontrado.`);
  const alreadyKnown = DiscoveryService.isDiscovered(sourceKey, user);
  const result = await DiscoveryService.discover(sourceKey, userId, { popup });
  if (popup && !alreadyKnown && userId === game.user.id) await DiscoveryPopup.show(sourceKey);
  NazumiCompendium.instance?.render({ force: true });
  return result;
}

async function discoverByName(name, userId = game.user.id, { popup = true } = {}) {
  const entry = await SourceService.findByName(name);
  if (!entry) throw new Error(`Nazumi Compendium: nenhum item chamado '${name}' foi encontrado.`);
  await discover(entry.sourceKey, userId, { popup });
  return entry;
}

function exposeApi() {
  const api = {
    open: () => NazumiCompendium.open(),
    refresh: async () => {
      SourceService.clearCache();
      const entries = await SourceService.getEntries({ refresh: true });
      NazumiCompendium.instance?.render({ force: true });
      return entries;
    },
    getEntries: (options) => SourceService.getEntries(options),
    getState: (sourceKey, user = game.user) => DiscoveryService.getItemState(sourceKey, user),
    discover,
    discoverByName,
    undiscover: async (sourceKey, userId = game.user.id) => {
      const result = await DiscoveryService.undiscover(sourceKey, userId);
      NazumiCompendium.instance?.render({ force: true });
      return result;
    },
    showPopup: (sourceKey) => DiscoveryPopup.show(sourceKey),
    tagItem
  };

  game.modules.get(MODULE_ID).api = api;
  game.nazumiCompendium = api;
}

function registerSocket() {
  game.socket.on(SOCKET_NAME, async (payload) => {
    if (!payload || payload.userId !== game.user.id) return;
    NazumiCompendium.instance?.render({ force: true });
    if (payload.type === "discover" && payload.popup) await DiscoveryPopup.show(payload.sourceKey);
  });
}

function registerAutoDiscovery() {
  Hooks.on("createItem", async (item, _options, userId) => {
    if (!game.settings.get(MODULE_ID, "autoDiscoverInventory")) return;
    if (item.parent?.documentName !== "Actor") return;
    if (userId !== game.user.id) return;

    const sourceKey = await SourceService.resolveSourceKeyFromItem(item);
    if (!sourceKey) return;

    const actor = item.parent;
    const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    let recipients = game.users.filter((user) => {
      if (user.isGM) return false;
      if (user.character?.id === actor.id) return true;
      return actor.testUserPermission?.(user, ownerLevel) ?? false;
    });

    if (!recipients.length && !game.user.isGM) recipients = [game.user];

    for (const user of recipients) {
      if (DiscoveryService.isDiscovered(sourceKey, user)) continue;
      await DiscoveryService.discover(sourceKey, user.id, { popup: true });
      if (user.id === game.user.id) await DiscoveryPopup.show(sourceKey);
    }
  });
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Inicializando v0.1.0`);
  registerSettings();
  registerKeybindings();
});

Hooks.once("ready", () => {
  exposeApi();
  registerSocket();
  registerAutoDiscovery();
  ensureLauncherButton();
  console.log(`${MODULE_ID} | Pronto. API: game.nazumiCompendium`);
});

Hooks.on("updateUser", (user, changes) => {
  if (user.id !== game.user.id) return;
  if (changes.flags?.[MODULE_ID]?.progress === undefined) return;
  NazumiCompendium.instance?.render({ force: true });
});
