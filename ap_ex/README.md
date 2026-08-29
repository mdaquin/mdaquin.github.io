# Atelier d'exercices — algorithmique et programmation

Exercices d'algorithmique et de programmation pour le cours de remise à niveau
informatique (*Remise_à_Niveau_Informatique_2026.pdf*). Site statique en
JavaScript sans dépendance ; exercices produits et corrigés par un modèle de
langage via [OpenRouter](https://openrouter.ai).

Deux pages :

| page | pour qui | quoi |
|---|---|---|
| `index.html` | étudiant | faire un exercice et faire vérifier sa réponse |
| `generer.html` | enseignant | produire des exercices et les télécharger |

Les deux pages sont indépendantes : on passe de l'une à l'autre par son adresse.

## Lancer

```sh
python3 -m http.server 8000
```

puis ouvrir <http://localhost:8000>.

Le serveur local n'est pas une commodité : ouvrir les fichiers directement
(`file://`) empêche la lecture de la banque d'exercices, et certains navigateurs
y bloquent aussi les appels réseau. La page le signale et propose alors
d'ouvrir un fichier d'exercice depuis le disque, qui fonctionne toujours.

## Faire un exercice (`index.html`)

À l'ouverture, deux voies : la **banque** (`exercices_bank/`, via son index) ou
un **fichier JSON** téléchargé depuis le générateur — bouton *Ouvrir un
fichier…*, ou glisser-déposer sur la page.

La banque se filtre par type, domaine, niveau et notion — les listes déroulantes
sont construites à partir des facettes de l'index, donc elles ne proposent que
des valeurs qui existent — et par recherche libre sur le titre, le résumé et le
domaine.

L'exercice ouvert affiche son énoncé, puis les champs de réponse qui
correspondent à son type :

| type | champs |
|---|---|
| *Écrire l'algorithme* | une zone de rédaction en pseudo-code |
| *Traduire en Python* | une zone de code |
| *Dérouler l'algorithme* | un champ par jeu de valeurs |
| *Lire un programme Python* | un champ par question |

Pour les deux derniers, les jeux de valeurs et les questions ne sont pas répétés
dans l'énoncé : ils servent d'intitulé aux champs.

**Vérifier** envoie l'énoncé et les réponses au modèle de correction. Chaque
réponse reçoit un statut (*juste*, *en partie*, *à revoir*, *sans réponse*), un
commentaire qui explique où le raisonnement dérape, et la réponse attendue ; puis
un bilan d'ensemble, et pour les exercices de rédaction une solution possible,
repliée. Les consignes demandent au correcteur de résoudre l'exercice lui-même
d'abord, puis de juger le fond : ni l'orthographe, ni les noms de variables, ni
une méthode différente de la sienne ne comptent comme des erreurs.

Un champ laissé vide n'est pas une faute : le correcteur donne quand même la
réponse attendue et une indication de méthode.

## Premier réglage

Icône ⚙︎ en haut à droite : y saisir une **clé API OpenRouter** et le **nom du
modèle** (identifiant exact). Le bouton *Tester la connexion* vérifie les deux.
Clé et modèle sont conservés dans le `localStorage` du navigateur et ne sont
transmis qu'à OpenRouter.

Les deux pages ont **leur propre réglage** : générer et corriger ne demandent
pas la même chose au modèle. Tant que rien n'a été enregistré côté correction,
celle-ci reprend la clé et le modèle du générateur — enregistrer les dissocie
définitivement. La correction est réglée par défaut à une température basse
(0,2) : on veut des corrections stables, pas créatives.

Pour corriger, préférez un modèle solide : il doit dérouler un algorithme sans
se tromper, ce qui est plus exigeant que rédiger un énoncé. La lenteur se
remarque moins ici, puisqu'il n'y a qu'un appel à la fois.

### Quel modèle ?

Le défaut est **`google/gemma-4-26b-a4b-it:free`** : gratuit, architecture MoE
(≈3,8 B paramètres actifs) donc rapide — ce qui compte puisque les types
sélectionnés sont générés en parallèle — bon en français, et compatible avec la
sortie JSON structurée demandée par l'outil.

Autres pistes gratuites, par ordre de qualité décroissante / rapidité croissante :

| modèle | remarque |
|---|---|
| `nvidia/nemotron-3-super-120b-a12b:free` | énoncés plus fins, nettement plus lent |
| `google/gemma-4-31b-it:free` | dense 31 B, bon français |
| `openai/gpt-oss-20b:free` | correct, français moins naturel |

À éviter : `openrouter/free`, qui choisit un modèle gratuit **au hasard** à chaque
appel — la qualité et le respect du format varient d'un exercice à l'autre.

Deux limites propres au gratuit : un quota de requêtes par jour et par compte
(chaque enseignant/étudiant doit donc avoir sa propre clé), et des modèles « à
raisonnement » dont les tokens de réflexion consomment le budget de sortie. Si
un exercice échoue avec un message de réponse tronquée, changer de modèle.

Le curseur *Variété des exercices* règle la température du modèle : plus il est
bas, plus les exercices se ressemblent d'une génération à l'autre.

## Utilisation

1. **Domaine** — facultatif, libre ou choisi parmi les pastilles. Sans domaine,
   l'exercice reste abstrait (nombres, listes, chaînes, variables neutres).
2. **Notions** — chaque pastille a trois états, obtenus par clics successifs :
   *indifférente* → *à inclure* (vert) → *à exclure* (rose, barré). On peut
   ajouter ses propres notions. Sans rien d'inclus, le générateur s'en tient aux
   bases.

   Les notions **exclues** sont celles qui n'ont pas encore été vues en cours :
   la consigne interdit au modèle de les faire apparaître où que ce soit —
   contexte, énoncé, entrées/sortie, algorithme, code Python, jeux de valeurs,
   piste — et lui demande de changer de sujet plutôt que de les contourner.
   Typiquement : demander une boucle bornée en excluant *listes / tableaux*.
3. **Types d'exercice** — un ou plusieurs, chacun produit sa propre carte :
   - *Écrire l'algorithme* : un problème est posé, l'étudiant rédige le pseudo-code ;
   - *Dérouler l'algorithme* : un algorithme et des jeux de valeurs sont fournis ;
   - *Traduire en Python* : un algorithme est fourni, l'étudiant écrit le programme ;
   - *Lire un programme Python* : un programme est fourni, l'étudiant en donne le résultat.
4. **Niveau** — découverte, intermédiaire, avancé.

Ensuite : **Générer**. Les types sélectionnés sont générés en parallèle. Chaque
carte porte deux boutons : **↻** la regénère seule (avec les paramètres courants
du panneau), **⤓** télécharge son JSON. *Regénérer* et *Imprimer*, en haut,
agissent sur l'ensemble.

**Seul l'énoncé est généré** — jamais la correction, ni les résultats attendus.
C'est une contrainte explicite des consignes envoyées au modèle.

*Imprimer* produit une version papier des énoncés, sans l'interface, avec un
espace de réponse réglé sous chaque exercice.

## Voir le prompt

Le bouton **Prompt**, à côté de *Générer*, montre ce qui serait envoyé au modèle
avec les réglages courants du panneau — un prompt par type sélectionné, en deux
messages : les consignes générales (rôle système, identiques pour tous les types)
et l'instruction (rôle utilisateur, qui porte le domaine, les notions incluses et
exclues, le niveau et le gabarit JSON attendu).

*Copier* reprend les deux à la suite, prêt à coller dans n'importe quelle
interface de chat : de quoi générer un exercice sans passer par OpenRouter, ou
vérifier ce que le modèle reçoit vraiment quand un résultat surprend. L'aperçu
est reconstruit par la même fonction que la génération, il ne peut donc pas
diverger de ce qui est réellement envoyé — à ceci près que la graine de
variation, en fin d'instruction, est retirée au hasard à chaque génération.

## Fichier téléchargé

Un exercice se télécharge individuellement, en JSON, via **⤓** sur sa carte. Le
fichier est autonome : il contient l'énoncé et les paramètres qui l'ont produit,
de quoi le rejouer ou l'exploiter plus tard.

```json
{
  "type": "derouler",
  "titre": "Croissance d'une culture de bactéries",
  "data": { "titre": "…", "enonce": "…", "algorithme": "…", "cas": ["h = 3"] },
  "params": { "domain": "biologie", "notions": ["…"], "exclusions": ["…"], "level": "intermédiaire" },
  "generatedAt": "2026-08-09T08:10:00.000Z"
}
```

Le nom du fichier reprend le type et le titre :
`exercice_derouler_croissance-d-une-culture-de-bacteries_2026-08-09_1010.json`.

Les champs de `data` dépendent du type — `algorithme` et `cas` pour *dérouler*,
`code_python` et `questions` pour *lire*, `entrees`/`sortie` pour *écrire*.

Rien n'est conservé entre deux sessions à part les réglages du modèle et le
dernier état du formulaire : un exercice non téléchargé est perdu à la
regénération.

## Banque d'exercices et index

Les exercices téléchargés qu'on souhaite conserver sont rangés à la main dans
`exercices_bank/`. Le script `build_index.py` en construit un index, pour
parcourir et filtrer la banque plus tard sans ouvrir chaque fichier :

```sh
python3 build_index.py            # exercices_bank/ -> exercices_bank/index.json
python3 build_index.py --check    # signale les fichiers illisibles, sans rien écrire
python3 build_index.py -d banque -o public/index.json
```

À relancer après chaque ajout de fichier. Sans dépendance, et sans effet de bord :
l'index est reconstruit entièrement, jamais complété.

L'index contient d'abord des **facettes** — valeurs rencontrées et leurs
occurrences pour `types`, `domaines`, `niveaux`, `notions`, `exclusions` — de
quoi peupler des filtres sans parcourir les entrées. Puis une entrée par
exercice, la plus récente en tête :

```json
{
  "id": "exercice_derouler_analyse-du-niveau-de-fatigue_2026-08-09_1131",
  "fichier": "exercice_derouler_analyse-du-niveau-de-fatigue_2026-08-09_1131.json",
  "type": "derouler", "type_libelle": "Dérouler l'algorithme",
  "titre": "Analyse du niveau de fatigue",
  "domaine": "psychologie", "niveau": "découverte",
  "notions": ["variables et affectation", "…"], "exclusions": ["liste"],
  "genere_le": "2026-08-09T09:31:47.318Z",
  "resume": "Cet algorithme sert à évaluer un score de fatigue…",
  "contenu": { "algorithme": true, "code_python": false, "cas": 3, "questions": 0, "aide": true },
  "octets": 1680
}
```

`resume` donne de quoi afficher une liste sans ouvrir les fichiers, et `contenu`
décrit ce que l'exercice porte réellement — utile pour filtrer autrement que par
type (« ceux qui ont au moins trois jeux de valeurs », par exemple).

Un fichier illisible ou sans champ `data` est signalé sur la sortie d'erreur et
ignoré, pour qu'un fichier abîmé ne bloque pas l'index. Les variations de clés
des modèles sont absorbées (`contexte` / `context`).

## Organisation du code

| fichier | rôle |
|---|---|
| `index.html` · `js/do.js` | page « faire un exercice » |
| `generer.html` · `js/app.js` | page « générer des exercices » |
| `css/style.css` | mise en forme, pour les deux pages |
| `js/catalog.js` | liste des notions et des types d'exercice |
| `js/store.js` | persistance (réglages génération et correction, dernier formulaire) |
| `js/openrouter.js` | appel de l'API, extraction du JSON, messages d'erreur |
| `js/render.js` | rendu des énoncés, coloration pseudo-code/Python |
| `js/prompts.js` | consignes de **génération**, gabarit JSON par type |
| `js/check.js` | consignes de **correction**, normalisation du verdict |
| `js/answers.js` | champs de réponse attendus, par type |
| `js/bank.js` | lecture de l'index de la banque et filtrage |
| `build_index.py` | index de la banque d'exercices (hors interface) |

Ajouter un type d'exercice touche quatre endroits : une entrée dans
`Catalog.TYPES`, un gabarit dans `Prompts.TEMPLATES`, une branche dans
`Render.bodyHTML` (affichage de l'énoncé) et une dans `Answers.fieldsFor`
(champs de réponse).

Les scripts sont chargés en balises `<script>` classiques (pas de modules ES)
afin que l'ouverture directe du fichier reste possible.

## Conventions de pseudo-code

Celles du cours, imposées au modèle dans `js/prompts.js` et rappelées au
correcteur dans `js/check.js`.

**Séance 1** — en-tête `Entrée :` / `Sortie :`, corps entre `Début` et `Fin`,
affectation `←`, `Pour i de 1 à n faire`, `Tant que … faire`, `Si … alors` /
`Sinon`, `Renvoyer`, `Afficher`, opérateurs `×`, `≠`, `≤`, `≥`, `ET`, `OU`,
`NON`.

**Séance 2** — entrées/sorties `Lire nom`, `Afficher "Moyenne :", moy` ;
listes `L ← []`, `L[i]`, `Longueur(L)`, `Ajouter(L, x)`, `Supprimer(L, i)`,
`x ∈ L`, **indices à partir de 0** ; parcours `Pour i de 0 à Longueur(L) − 1` ou
`Pour chaque x dans L` ; matrices `M[i][j]` (liste de listes) ; dictionnaires
`D ← {}`, `D[cle] ← x`, `cle ∈ D`, `Pour chaque (cle, val) dans D` ; fonctions
déclarées `Fonction Carre(x) : … Fin` et appelées par leur nom.

**Séance 3** — récursivité (cas d'arrêt puis cas général) ; concaténation de
listes avec `+` ; file `F ← file vide`, `ajouter(F, x)`, `retirer(F)` ; pile
`P ← pile vide`, `empiler(P, x)`, `dépiler(P)`, test `P est vide` — sans jamais
accéder par indice ; arbres (`racine`, `successeurs(nœud)`, feuille) et graphes ;
`Pour toujours faire` ; booléens `Vrai` / `Faux`.

Le pseudo-code désigne une partie de liste **en français** — « L sans son premier
élément », « les éléments de L inférieurs à pivot » — jamais par une tranche
`L[1:]`, qui appartient à Python et n'existe que dans la traduction.

**Séance 4** — classes (`Classe Noeud`, `Attributs :`, `Constructeur(v) :`,
`Méthode …`), création `A ← nouveau Noeud("A")`, appel `A.ajouterSuccesseur(B)`,
attribut `A.successeurs`, `this.valeur` ; héritage `Classe Triangle(Polygone)` et
`super.Constructeur(…)`.

### Consignes propres à une notion

Certaines notions produisent, sans consigne dédiée, un exercice où la notion est
présente mais ne sert à rien. `Prompts.NOTION_GUIDES` permet d'attacher des
exigences supplémentaires à une notion : elles ne s'ajoutent au prompt que si
elle est demandée, avec une variante par type d'exercice.

Trois entrées :

- **fonctions** — sans elle, tous les exercices se résumaient à une fonction
  unique contenant toute la solution et appelée une fois : la notion apparaissait
  sans être travaillée. La consigne impose que la fonction soit *nécessaire*
  (appelée plusieurs fois, ou deux fonctions dont l'une appelle l'autre, ou un
  calcul évité en double), que le programme principal subsiste, que les
  paramètres portent d'autres noms que les variables appelantes, et relève les
  limites de longueur — c'étaient elles qui poussaient le modèle à tout regrouper
  pour tenir en 14 lignes ;
- **récursivité** — impose la structure du cours (cas d'arrêt d'abord, puis cas
  général qui rapproche du cas d'arrêt, puis combinaison du résultat), interdit
  toute boucle, et limite la profondeur pour que l'exercice reste déroulable à la
  main ;
- **piles et files** — impose la discipline d'accès : jamais d'indice, jamais le
  milieu de la structure, test de vacuité avant de retirer, et un sujet où
  l'ordre de sortie est observable — sinon la structure n'est qu'une liste ;
- **listes de listes (matrices)** — sans elle, les exercices retombaient sur une
  liste plate. La consigne exige une donnée réellement à deux dimensions, un
  sujet qui la justifie, la distinction entre `M[i]` (une ligne, donc une liste)
  et `M[i][j]` (une case), un parcours à deux boucles imbriquées, et applique la
  limite de taille *par ligne* — sinon la règle « 3 à 6 éléments » interdisait de
  fait toute matrice ;
- **classes et objets** — au moins deux attributs, deux méthodes dont une qui
  modifie l'état, et surtout **deux objets** manipulés en parallèle : c'est ce qui
  montre que chaque objet a son propre état, et non une classe servant de fiche de
  données ;
- **héritage entre classes** — deux classes réellement liées, la fille ajoutant
  ou redéfinissant quelque chose, et un appel **hérité** obligatoire dans
  l'exercice : appeler sur un objet fille une méthode qu'il n'a pas déclarée est
  le point que la notion doit faire comprendre ;
- **modules et bibliothèques** — lève par exception l'interdiction d'importer,
  en la bornant : un seul module standard, déterministe (`math`, `time` en
  lecture, jamais `random`) ;
- **complexité algorithmique** — ajoute au travail habituel un comptage
  d'opérations puis la classe de complexité, en exigeant que ce qu'il faut
  compter soit nommé (comparaisons, tours de boucle) et que la complexité de
  l'algorithme choisi soit sans ambiguïté.

Une consigne peut en **remplacer** une autre via `supersedes` quand les deux se
contredisent : demander *fonctions* et *récursivité* ensemble n'applique que la
seconde, la première suggérant d'appeler la fonction dans une boucle.

Le prompt liste aussi **ce que les étudiants savent lire en Python** à ce stade
(`print`, `input`, conversions, `append`, `pop`, `del`, `in`, `is None`, `//`,
tranches `L[1:]`, `.items()`, `.values()`, `def`/`return`, appel récursif,
f-strings simples, annotations de type) et ce qui reste interdit faute d'avoir
été vu : `lambda`, `map`/`filter`/`zip`/`enumerate`, `sorted` avec clé, et toute
bibliothèque à importer. Les compréhensions de liste n'ayant été montrées qu'une
fois, dans le tri rapide, elles sont réservées à ce cas. Sans cette liste, les
modèles écrivent spontanément du Python idiomatique que les étudiants ne peuvent
pas lire.

## Suite prévue

- rien ne conserve le travail de l'étudiant : réponses et correction sont
  perdues au changement d'exercice ;
- pas de suivi d'une séance (série d'exercices enchaînés, progression) ;
- la correction n'est pas vérifiée : un modèle qui déroule mal un algorithme
  corrigera mal, sans que rien ne le signale.
