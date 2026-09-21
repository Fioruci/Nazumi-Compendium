# Nazumi Compendium v0.1.0

Modulo de compendio/codice imersivo para **Foundry Virtual Tabletop V13**, com uma linguagem visual dark-fantasy original, inspirada na navegacao contemplativa de action RPGs, sem incluir assets de Elden Ring/FromSoftware.

## O que existe nesta v0.1

- Interface fullscreen com `ApplicationV2 + HandlebarsApplicationMixin`.
- Categorias: Armas, Armaduras, Talismas, Consumiveis, Materiais, Itens-chave, Reliquias e Conhecimento.
- Busca client-side.
- Slots nao descobertos (`????????`).
- Estado individual por jogador armazenado em `User.flags`.
- Marcador `NOVO` ate o jogador inspecionar o registro.
- Inspector com mecanica + lore.
- Painel de GM para revelar/ocultar um registro por jogador ou para todos.
- Popup de descoberta.
- Efeitos sonoros originais incluidos no modulo.
- Botao fixo opcional + atalho **Alt+C**.
- Fonte configuravel: demo, Items do mundo ou qualquer Compendium Pack de `Item`.
- API de macros para revelar itens durante a sessao.
- Descoberta automatica opcional quando um Item entra no inventario de um Actor.

## Instalacao manual

1. Descompacte a pasta `nazumi-compendium` em:
   - Windows normalmente: `%localappdata%/FoundryVTT/Data/modules/`
   - ou na pasta `Data/modules/` do seu User Data configurado no Foundry.
2. O caminho final precisa ser exatamente:
   `Data/modules/nazumi-compendium/module.json`
3. Reinicie o Foundry VTT.
4. Entre no mundo e ative **Nazumi Compendium** em **Manage Modules**.
5. O modulo abre inicialmente no modo demonstracao.

## Fonte dos itens

Abra **Configure Settings > Module Settings > Nazumi Compendium > Fonte dos itens**.

### 1. Demo

Deixe o campo vazio. A interface usa `data/demo-items.json`.

### 2. Compendium Pack real

Informe o collection id do pack, por exemplo:

```text
meu-modulo.reliquias
```

O pack precisa ser do tipo `Item`. Os jogadores tambem precisam ter permissao de leitura do pack para que seus clientes carreguem os dados. Nesta v0.1, ocultar um registro e uma regra de interface/experiencia, nao uma barreira de seguranca contra inspecao tecnica dos dados pelo cliente.

### 3. Items do mundo

Informe:

```text
world
```

Neste modo somente Items com esta flag aparecem:

```javascript
await item.setFlag("nazumi-compendium", "enabled", true);
```

## Metadados opcionais por Item

O modulo nao altera o schema do D&D5e. Ele usa flags proprias:

```javascript
await game.nazumiCompendium.tagItem(item.uuid, {
  enabled: true,
  category: "relics",
  rarity: "legendary",
  subtitle: "Reliquia Draconica",
  lore: "Texto de lore do item.",
  mechanics: "Texto mecanico opcional.",
  icon: "fa-solid fa-feather-pointed",
  sort: 10
});
```

Se `mechanics` nao for definido, o modulo tenta utilizar `item.system.description.value`.

Categorias suportadas:

```text
weapons
armor
talismans
consumables
materials
key-items
relics
lore
```

Raridades suportadas:

```text
common
uncommon
rare
epic
legendary
```

## API / Macros

A API fica disponivel em:

```javascript
game.nazumiCompendium
```

### Abrir o compendio

```javascript
game.nazumiCompendium.open();
```

### Descobrir pelo UUID/sourceKey

```javascript
await game.nazumiCompendium.discover("Compendium.meu-modulo.reliquias.Item.ABC123");
```

Para revelar a outro usuario, passe o id:

```javascript
await game.nazumiCompendium.discover(
  "Compendium.meu-modulo.reliquias.Item.ABC123",
  "USER_ID"
);
```

### Descobrir pelo nome

Mais pratico para macros de cena:

```javascript
await game.nazumiCompendium.discoverByName("Marca das Asas Partidas");
```

### Ocultar novamente

```javascript
await game.nazumiCompendium.undiscover("Compendium.meu-modulo.reliquias.Item.ABC123");
```

### Testar apenas o popup

```javascript
await game.nazumiCompendium.showPopup("demo:wing-mark");
```

## Descoberta automatica pelo inventario

A configuracao **Descobrir ao receber Item** vem desligada por padrao.

Quando ligada, ao criar um Item dentro de um Actor o modulo tenta localizar a entrada correspondente nesta ordem:

1. `flags.nazumi-compendium.sourceKey`
2. `flags.core.sourceId`
3. UUID do Item
4. mesmo `name` + `type`

Para uma integracao controlada, o recomendado e gravar explicitamente o sourceKey no Item entregue:

```javascript
await item.setFlag(
  "nazumi-compendium",
  "sourceKey",
  "Compendium.meu-modulo.reliquias.Item.ABC123"
);
```

## Onde fica o progresso

O progresso nao fica no Item. Ele e salvo no documento `User`:

```text
flags.nazumi-compendium.progress
```

Isso significa que o jogador pode perder, vender ou entregar um item sem apagar a descoberta do Compendio.

## Limites conhecidos da v0.1

- Ainda nao existe editor grafico de metadados dentro da ficha do Item; use flags/API.
- Lore progressiva em niveis esta preparada no modelo (`loreLevel`), mas nao possui UI nesta versao.
- Nao existe ainda secao de Criaturas, NPCs ou Locais.
- O modulo nao cria nem empacota um Compendium de Items proprio, porque isso exigiria vincular o pack a um sistema especifico. Em vez disso, ele le qualquer pack de Items configurado.
- A integracao automatica de inventario e deliberadamente conservadora e vem desligada.

## Arquivos principais

```text
nazumi-compendium/
├── module.json
├── README.md
├── scripts/
│   ├── main.js
│   ├── constants.js
│   ├── applications/
│   ├── services/
│   └── ui/
├── templates/
├── styles/
├── data/
└── assets/audio/
```

## Desenvolvimento

Compatibilidade alvo: Foundry VTT V13 Stable.

A interface usa APIs publicas de V13 e evita `Application` V1/jQuery como base da UI. O modulo mantem os dados adicionais em flags namespaced para minimizar acoplamento com o sistema D&D5e.
