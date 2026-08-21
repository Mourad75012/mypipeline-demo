# ECC — rapport d'exécution

Exécution de [github.com/affaan-m/ecc](https://github.com/affaan-m/ecc) (`ecc-universal` 2.2.0),
le « agent harness operating system » : un CLI Node qui installe des rules, agents,
commands, hooks et skills dans les répertoires de configuration de différents
harnais (Claude Code, Codex, Cursor, OpenCode, Gemini, Zed, …).

Rejouable via [`ecc/run-ecc.sh`](run-ecc.sh).

## Contexte

| | |
|---|---|
| Commit ECC | `d8409a4b0813771235555e32e3d8046a73988bfa` (« Merge pull request #2824 … ») |
| Version | 2.2.0 |
| Date | 2026-08-21 |
| Plateforme | Linux x86_64, conteneur headless |
| Node / npm | v22.22.2 / 10.9.7 (le paquet exige `>=18`) |
| Python | 3.11.15 (le dépôt épingle 3.12.8 dans `.tool-versions`) |

## Étapes exécutées

| Étape | Commande | Résultat |
|---|---|---|
| Dépendances | `npm install` | 210 paquets, ~7 s |
| CLI | `node scripts/ecc.js --help` | OK — 26 sous-commandes |
| Lint | `npm run lint` (eslint + markdownlint) | OK, 0 erreur |
| Tests | `npm test` | **3939 / 3939** ✓ |
| Audit harnais | `npm run harness:audit` | **80 / 80**, 31 checks, 0 en échec |
| Plan d'install | `ecc plan --profile developer --target claude` | 10 modules, 144 opérations |
| Install réelle | `ecc install --profile core --target claude` (HOME bac à sable) | **658 fichiers** écrits |
| Vérification | `ecc doctor` / `list-installed` / `status` | `checked=1, ok=1, 0 erreur` ; readiness `ok` |
| Conseil | `ecc consult "security reviews"` | 4 composants pertinents proposés |
| Dashboard web | `node scripts/dashboard-web.js 8791` | HTTP 200, page de 613 Ko |
| Dashboard Tk | `python3 ./ecc_dashboard.py` | Indisponible (pas de Tkinter) — sortie propre avec instructions |

L'installation vise un `HOME` jetable, donc le `~/.claude` de l'hôte n'est jamais modifié.

## Constats

### 1. `npm test` échoue si l'on lance la suite depuis une session Claude Code

`skills/continuous-learning-v2/hooks/observe.sh` filtre les sessions non
interactives (couche 1) :

```sh
case "${CLAUDE_CODE_ENTRYPOINT:-cli}" in
  cli|sdk-ts|claude-desktop|claude-vscode) ;;
  *) exit 0 ;;
esac
```

Le test `observe.sh falls back to legacy output fields when tool_response is null`
(`tests/hooks/hooks.test.js:3384`) ne fixe que `HOME`, `USERPROFILE` et
`CLAUDE_PROJECT_DIR` ; le reste de l'environnement est hérité. Lancée depuis une
session Claude Code où `CLAUDE_CODE_ENTRYPOINT` vaut par exemple `remote_mobile`,
la garde se déclenche, `observations.jsonl` n'est jamais écrit et le test tombe sur
`ENOENT`. C'est un défaut d'isolation du test, pas un bug de `observe.sh` : hors
d'un harnais la variable est absente et le défaut `cli` s'applique.

Premier passage : 3938/3939. Avec `CLAUDE_CODE_ENTRYPOINT=cli` : 3939/3939.
`run-ecc.sh` épingle la variable pour cette raison.

Correctif en amont possible : fixer `CLAUDE_CODE_ENTRYPOINT: 'cli'` dans l'`env`
du test, au même titre que `HOME`.

### 2. `npm run dashboard:web` plante sur une machine sans `xdg-open`

`scripts/dashboard-web.js:928` ouvre le navigateur après le `listen` :

```js
try { const { spawn } = require('child_process'); … spawn(c, [dashboardUrl], { stdio: 'ignore' }); } catch { /* best-effort auto-open */ }
```

`spawn` signale `ENOENT` de façon **asynchrone**, via un événement `error` sur le
`ChildProcess` — le `try/catch` synchrone ne l'intercepte pas. Sans écouteur
`error`, Node relaie l'événement en exception non gérée et le processus meurt,
serveur compris, alors que le dashboard répondait déjà :

```
Error: spawn xdg-open ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process:285:19)
```

Cela touche tout hôte headless (CI, conteneurs, serveurs, WSL sans bureau).
Avec un `xdg-open` factice dans le `PATH`, le serveur répond bien HTTP 200 :
le seul problème est le lanceur de navigateur.

Correctif en amont : attacher un écouteur au lieu de compter sur le `catch`,
p. ex. `const child = spawn(c, [url], { stdio: 'ignore' }); child.on('error', () => {});`.

### 3. `--port` n'est pas reconnu par le dashboard web

L'usage documenté est positionnel (`node scripts/dashboard-web.js [port]`).
`--port 8791` est rejeté (`[ECC] Invalid port: --port — using 3456`) puis ignoré.
Comportement conforme à la doc, mais divergent de `ecc control-pane --port <n>`
qui, lui, accepte le drapeau.

## Reproduire

```bash
./ecc/run-ecc.sh                       # profil « core », cible « claude »
ECC_PROFILE=developer ./ecc/run-ecc.sh # autre profil
ECC_REF=v2.2.0 ./ecc/run-ecc.sh        # autre branche/tag
```

Le script clone dans `./.ecc-run/` (ignoré par git) et n'écrit rien ailleurs.
