import { MODULE_ID, SOCKET_NAME } from "../constants.js";
import { SourceService } from "./source-service.js";

export class DiscoveryService {
  static getState(user = game.user) {
    return foundry.utils.deepClone(user.getFlag(MODULE_ID, "progress") ?? {});
  }

  static getItemState(sourceKey, user = game.user) {
    const progress = this.getState(user);
    return progress[sourceKey] ?? { discovered: false, viewed: false, loreLevel: 0 };
  }

  static isDiscovered(sourceKey, user = game.user) {
    return this.getItemState(sourceKey, user).discovered === true;
  }

  static isNew(sourceKey, user = game.user) {
    const state = this.getItemState(sourceKey, user);
    return state.discovered === true && state.viewed !== true;
  }

  static async setDiscovered(sourceKey, discovered, userId = game.user.id, { popup = true } = {}) {
    const user = game.users.get(userId);
    if (!user) throw new Error(`Nazumi Compendium: usuario '${userId}' nao encontrado.`);

    const progress = this.getState(user);
    const current = progress[sourceKey] ?? {};

    if (discovered) {
      progress[sourceKey] = {
        discovered: true,
        viewed: current.viewed ?? false,
        loreLevel: current.loreLevel ?? 1,
        discoveredAt: current.discoveredAt ?? Date.now()
      };
    } else {
      delete progress[sourceKey];
    }

    await user.setFlag(MODULE_ID, "progress", progress);

    if (game.user.isGM && userId !== game.user.id) {
      game.socket.emit(SOCKET_NAME, {
        type: discovered ? "discover" : "hide",
        userId,
        sourceKey,
        popup
      });
    }

    Hooks.callAll("nazumiCompendiumDiscoveryChanged", { userId, sourceKey, discovered });
    return progress[sourceKey] ?? null;
  }

  static async discover(sourceKey, userId = game.user.id, options = {}) {
    const entry = await SourceService.getEntry(sourceKey);
    if (!entry) throw new Error(`Nazumi Compendium: item '${sourceKey}' nao existe na fonte atual.`);
    return this.setDiscovered(sourceKey, true, userId, options);
  }

  static async undiscover(sourceKey, userId = game.user.id) {
    return this.setDiscovered(sourceKey, false, userId, { popup: false });
  }

  static async markViewed(sourceKey, userId = game.user.id) {
    const user = game.users.get(userId);
    if (!user) return;
    const progress = this.getState(user);
    const current = progress[sourceKey];
    if (!current?.discovered || current.viewed) return;
    progress[sourceKey] = { ...current, viewed: true, viewedAt: Date.now() };
    await user.setFlag(MODULE_ID, "progress", progress);
    Hooks.callAll("nazumiCompendiumDiscoveryChanged", { userId, sourceKey, discovered: true, viewed: true });
  }

  static async discoverByName(name, userId = game.user.id, options = {}) {
    const entry = await SourceService.findByName(name);
    if (!entry) throw new Error(`Nazumi Compendium: nenhum item chamado '${name}' foi encontrado.`);
    await this.discover(entry.sourceKey, userId, options);
    return entry;
  }

  static async revealAllPlayers(sourceKey) {
    if (!game.user.isGM) return;
    const players = game.users.filter((user) => !user.isGM);
    for (const user of players) await this.discover(sourceKey, user.id, { popup: true });
  }

  static async hideFromAllPlayers(sourceKey) {
    if (!game.user.isGM) return;
    const players = game.users.filter((user) => !user.isGM);
    for (const user of players) await this.undiscover(sourceKey, user.id);
  }
}
