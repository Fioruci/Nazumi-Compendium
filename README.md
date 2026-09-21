# Nazumi Compendium

Módulo de compêndio/códice imersivo para **Foundry Virtual Tabletop V13**, com uma linguagem visual dark-fantasy original, inspirada na navegação contemplativa de action RPGs, sem incluir assets de Elden Ring/FromSoftware.

## Recursos

- Interface em tela cheia com `ApplicationV2 + HandlebarsApplicationMixin`.
- Categorias: Armas, Armaduras, Talismãs, Consumíveis, Materiais, Itens-chave, Relíquias e Conhecimento.
- Busca client-side e lista rolável.
- Slots não descobertos (`????????`).
- Estado individual por jogador armazenado em `User.flags`.
- Marcador `NOVO` até o jogador inspecionar o registro.
- Inspetor com mecânica e lore, aberto sobre a tela principal.
- Painel do Mestre para revelar ou ocultar um registro por jogador ou para todos.
- Popup de descoberta.
- Efeitos sonoros originais incluídos no módulo.
- Botão nativo nos controles de Token da barra lateral esquerda e atalho **Alt+C**.
- Fonte configurável: demonstração, Items do mundo ou qualquer Compendium Pack de `Item`.
- API de macros para revelar e ocultar itens durante a sessão.
- Descoberta automática opcional quando um Item entra no inventário de um Actor.

## Instalação manual

1. Descompacte a pasta `nazumi-compendium` em:
   - Windows: `%localappdata%/FoundryVTT/Data/modules/`;
   - ou na pasta `Data/modules/` do User Data configurado no Foundry.
2. O caminho final precisa ser exatamente `Data/modules/nazumi-compendium/module.json`.
3. Reinicie o Foundry VTT.
4. Entre no mundo e ative **Nazumi Compendium** em **Manage Modules**.
5. O módulo abre inicialmente no modo demonstração.

## Como abrir o Compêndio

Com a opção **Exibir controle do Compêndio** ativada, selecione os controles de Token na barra lateral esquerda. O botão com ícone de livro abre o Compêndio usando a interface nativa de controles do Foundry.

O atalho **Alt+C** continua disponível mesmo quando o botão lateral estiver desativado nas configurações do módulo.

## Fonte dos itens

Abra **Configure Settings > Module Settings > Nazumi Compendium > Fonte dos itens**.

### 1. Demonstração

Deixe o campo vazio. A interface usa `data/demo-items.json`.

### 2. Compendium Pack real

Informe o collection id do pack, por exemplo:

```text
meu-modulo.reliquias
```

O pack precisa ser do tipo `Item`. Os jogadores também precisam ter permissão de leitura do pack para que seus clientes carreguem os dados. Ocultar um registro é uma regra de interface e experiência, não uma barreira de segurança contra inspeção técnica dos dados pelo cliente.

### 3. Items do mundo

Informe:

```text
world
```

Neste modo, somente Items com esta flag aparecem:

```javascript
await item.setFlag("nazumi-compendium", "enabled", true);
```

## Metadados opcionais por Item

O módulo não altera o schema do D&D5e. Ele usa flags próprias:

```javascript
await game.nazumiCompendium.tagItem(item.uuid, {
  enabled: true,
  category: "relics",
  rarity: "legendary",
  subtitle: "Relíquia Dracônica",
  lore: "Texto de lore do item.",
  mechanics: "Texto mecânico opcional.",
  icon: "fa-solid fa-feather-pointed",
  sort: 10
});
```

Se `mechanics` não for definido, o módulo tenta utilizar `item.system.description.value`.

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

## Controle de descoberta

O Mestre pode usar o inspetor para alternar cada jogador entre **Descoberto** e **Oculto**, ou usar **Revelar todos** e **Ocultar todos**. O estado oculto é gravado explicitamente para evitar que a mesclagem de flags do Foundry restaure um valor antigo.

O progresso fica no documento `User`:

```text
flags.nazumi-compendium.progress
```

Isso significa que o jogador pode perder, vender ou entregar um item sem apagar a descoberta do Compêndio.

## Sobreposição do inspetor

O inspetor usa uma `ApplicationV2` independente. Para que ele seja aberto sobre a tela principal, a aplicação principal é atualizada primeiro; em seguida, o inspetor é renderizado, recebe `bringToFront()` e mantém um `z-index` superior ao do Compêndio. A ficha original aberta pelo botão **Item** recebe uma camada ainda mais alta, permanecendo sobre o próprio inspetor.

Ao criar outras telas sobrepostas, mantenha a mesma ordem:

```javascript
await appPrincipal.render({ force: true });
await appSobreposto.render({ force: true });
appSobreposto.bringToFront();
```

Também defina um `z-index` maior para a aplicação sobreposta no CSS.

## API e macros

A API fica disponível em:

```javascript
game.nazumiCompendium
```

### Abrir o Compêndio

```javascript
game.nazumiCompendium.open();
```

### Descobrir pelo UUID/sourceKey

```javascript
await game.nazumiCompendium.discover("Compendium.meu-modulo.reliquias.Item.ABC123");
```

Para revelar a outro usuário, passe o id:

```javascript
await game.nazumiCompendium.discover(
  "Compendium.meu-modulo.reliquias.Item.ABC123",
  "USER_ID"
);
```

### Descobrir pelo nome

```javascript
await game.nazumiCompendium.discoverByName("Marca das Asas Partidas");
```

### Ocultar novamente

```javascript
await game.nazumiCompendium.undiscover(
  "Compendium.meu-modulo.reliquias.Item.ABC123",
  "USER_ID"
);
```

### Testar apenas o popup

```javascript
await game.nazumiCompendium.showPopup("demo:wing-mark");
```

## Descoberta automática pelo inventário

A configuração **Descobrir ao receber Item** vem desligada por padrão.

Quando ligada, ao criar um Item dentro de um Actor o módulo tenta localizar a entrada correspondente nesta ordem:

1. `flags.nazumi-compendium.sourceKey`;
2. `flags.core.sourceId`;
3. UUID do Item;
4. mesmo `name` + `type`.

Para uma integração controlada, grave explicitamente o sourceKey no Item entregue:

```javascript
await item.setFlag(
  "nazumi-compendium",
  "sourceKey",
  "Compendium.meu-modulo.reliquias.Item.ABC123"
);
```

## Limites conhecidos

- Ainda não existe editor gráfico de metadados dentro da ficha do Item; use flags/API.
- Lore progressiva em níveis está preparada no modelo (`loreLevel`), mas não possui UI.
- Ainda não existem seções de Criaturas, NPCs ou Locais.
- O módulo não cria nem empacota um Compendium de Items próprio. Em vez disso, ele lê qualquer pack de Items configurado.
- A integração automática de inventário é deliberadamente conservadora e vem desligada.

## Arquivos principais

```text
nazumi-compendium/
|-- module.json
|-- README.md
|-- CHANGELOG.md
|-- scripts/
|   |-- main.js
|   |-- constants.js
|   |-- applications/
|   |-- services/
|   `-- ui/
|-- templates/
|-- styles/
|-- data/
`-- assets/audio/
```

## Desenvolvimento

Compatibilidade alvo: Foundry VTT V13 Stable.

A interface usa APIs públicas de V13 e evita `Application` V1/jQuery como base da UI. O módulo mantém os dados adicionais em flags namespaced para minimizar o acoplamento com o sistema D&D5e.
