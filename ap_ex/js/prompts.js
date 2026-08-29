/* Construction des messages envoyés au modèle, un jeu par type d'exercice.
   Règle absolue : le modèle produit l'énoncé, jamais la correction. */
(function (global) {
  'use strict';

  var CONVENTIONS = [
    'Conventions de pseudo-code du cours (à respecter strictement) :',
    '- en français, lisible par un humain, jamais exécutable ;',
    '- en-tête « Entrée : » (une ligne par donnée) puis « Sortie : » ;',
    '- corps encadré par « Début » et « Fin », indentation de 2 espaces par niveau ;',
    '- affectation avec la flèche ← (par ex. « somme ← 0 ») ;',
    '- boucle bornée « Pour i de 1 à n faire » … « Fin » ;',
    '- boucle non bornée « Tant que condition faire » … « Fin » ;',
    '- conditionnelle « Si condition alors » … « Sinon » … « Fin » ;',
    '- opérateurs ×, /, +, −, =, ≠, ≤, ≥, ET, OU, NON ;',
    '- « Renvoyer x » pour la valeur de sortie, « Afficher x » pour un affichage ;',
    '- lecture au clavier : « Lire nom » ; affichage combiné : « Afficher "Moyenne :", moy ».',
    '',
    'Notations vues en cours pour les structures de données (ne pas en inventer d\'autres) :',
    '- liste : création « L ← [] », accès « L[i] », modification « L[i] ← x »,',
    '  taille « Longueur(L) », ajout « Ajouter(L, x) », suppression « Supprimer(L, i) »,',
    '  appartenance « x ∈ L » ;',
    '- les indices d\'une liste commencent à 0 : la dernière case est L[Longueur(L) − 1] ;',
    '- une PARTIE de liste se désigne en français, jamais par une tranche à la Python :',
    '  « L sans son premier élément », « les éléments de L strictement inférieurs à pivot ».',
    '  La notation L[1:] appartient à Python et n\'a pas sa place dans un pseudo-code ;',
    '- parcours par indice « Pour i de 0 à Longueur(L) − 1 faire », par élément',
    '  « Pour chaque x dans L faire » ;',
    '- matrice : une liste de listes, l\'élément ligne i colonne j s\'écrit M[i][j] ;',
    '- une chaîne de caractères se parcourt comme une liste de caractères ;',
    '- dictionnaire : création « D ← {} », accès « D[cle] », ajout ou modification',
    '  « D[cle] ← x », suppression « Supprimer(D, cle) », appartenance d\'une clé « cle ∈ D »,',
    '  nombre de couples « Longueur(D) », parcours « Pour chaque cle dans D faire »,',
    '  « Pour chaque val dans Valeurs(D) faire », « Pour chaque (cle, val) dans D faire » ;',
    '- fonction (sous-algorithme), déclarée avant le corps principal :',
    '    Fonction Carre(x) :',
    '      Renvoyer x × x',
    '    Fin',
    '  et appelée par son nom, par ex. « somme ← somme + Carre(x) » ;',
    '- concaténation de deux listes avec + , par ex. « gauche + [pivot] + droite » ;',
    '- file (FIFO) : « F ← file vide », « ajouter(F, x) » à la fin, « retirer(F) » au début,',
    '  test « F est vide » ;',
    '- pile (LIFO) : « P ← pile vide », « empiler(P, x) », « dépiler(P) », test « P est vide » ;',
    '  d\'une pile ou d\'une file, on ne touche QUE le sommet ou la tête : jamais P[i] ;',
    '- arbre : un nœud a une valeur et des successeurs ; « racine », « successeurs(nœud) »,',
    '  « Pour chaque enfant de nœud faire », une feuille est un nœud sans successeur ;',
    '- graphe : nœuds reliés par des arcs, éventuellement orienté ou pondéré ;',
    '- boucle sans fin : « Pour toujours faire » … « Fin » ;',
    '- valeurs booléennes « Vrai » et « Faux » ;',
    '- classe, avec ses attributs, son constructeur et ses méthodes :',
    '    Classe Noeud',
    '      Attributs :',
    '        valeur, la donnée associée au nœud',
    '        successeurs, liste des nœuds voisins',
    '      Constructeur(v) :',
    '        valeur ← v',
    '        successeurs ← liste vide',
    '      Méthode ajouterSuccesseur(n)',
    '        ajouter(successeurs, n)',
    '      Fin',
    '    Fin',
    '- création d\'un objet « A ← nouveau Noeud("A") », appel d\'une méthode',
    '  « A.ajouterSuccesseur(B) », accès à un attribut « A.successeurs »,',
    '  « this.valeur » pour désigner l\'attribut de l\'objet courant ;',
    '- héritage : « Classe Triangle(Polygone) », appel du constructeur parent avec',
    '  « super.Constructeur([c1, c2, c3]) » ; les attributs et méthodes du parent sont',
    '  hérités et s\'appellent sur l\'objet fils sans être redéclarés.'
  ].join('\n');

  /* Ce que les étudiants savent lire et écrire en Python à ce stade du cours. */
  var PYTHON_VU = [
    'Python vu en cours (ne rien utiliser d\'autre) :',
    '- affectation, opérateurs arithmétiques et de comparaison, and / or / not ;',
    '- division entière // et modulo % ;',
    '- if / elif / else, for … in range(…), for … in (liste, chaîne, dictionnaire), while, break ;',
    '- types int, float, str, bool, None, et les conversions int(x), float(x), str(x) ;',
    '- comparaison à None avec « is None » / « is not None » ;',
    '- print(…) et input(…), f-strings simples comme f"Note : {n}" ;',
    '- listes : [], L[i], len(L), L.append(x), del L[i], x in L, concaténation avec + ;',
    '- tranche de liste L[1:] ou L[a:b] : c\'est la traduction Python de « L sans son premier',
    '  élément », qui, elle, s\'écrit en français dans le pseudo-code ;',
    '- pile : P.append(x) pour empiler, P.pop() pour dépiler ; file : F.append(x) pour ajouter,',
    '  F.pop(0) pour retirer en tête ; test de vacuité avec len(P) == 0 ;',
    '- dictionnaires : {}, D[cle], del D[cle], cle in D, D.values(), D.items() ;',
    '- def pour définir une fonction, return pour sa valeur, appel récursif d\'une fonction ;',
    '- class, __init__(self, …) pour le constructeur, self.attribut, méthodes définies avec',
    '  def dans la classe, création « A = Noeud("A") », appel « A.ajouter_successeur(B) » ;',
    '- héritage « class Carre(Rectangle): » et appel du parent « super().__init__(…) » ;',
    '- L.remove(x) pour retirer un élément par sa valeur ;',
    '- annotations de type facultatives (par ex. « def f(n: int) -> int: ») ;',
    '- les compréhensions de liste n\'ont été vues qu\'une fois, dans le tri rapide : ne les',
    '  utilise pas, sauf si l\'exercice porte explicitement sur le tri rapide ;',
    '- INTERDIT : lambda, map, filter, zip, enumerate, sorted avec clé, dictionnaires en',
    '  compréhension, et toute bibliothèque à importer.'
  ].join('\n');

  var SYSTEM = [
    'Tu es enseignant en informatique. Tu prépares des exercices pour un cours de remise à niveau',
    "en algorithmique et programmation, destiné à de grands débutants (première approche de l'algorithme,",
    'du pseudo-code et de Python).',
    '',
    'Exigences de fond :',
    "- l'exercice doit être réalisable sur papier, en 5 à 15 minutes ;",
    '- une seule idée algorithmique à la fois, pas de piège gratuit, pas de bibliothèque externe ;',
    "- l'énoncé doit être complet et sans ambiguïté : un étudiant doit pouvoir le traiter sans poser de question ;",
    '- les valeurs numériques sont petites et manipulables à la main ;',
    '- les listes et les dictionnaires restent courts : 3 à 6 éléments, pas davantage ;',
    '- le vocabulaire technique est expliqué si nécessaire.',
    '',
    'INTERDIT ABSOLU : ne donne jamais la solution, ni le résultat attendu, ni un corrigé partiel,',
    "ni une amorce de réponse. Tu produis uniquement l'énoncé.",
    '',
    CONVENTIONS,
    '',
    PYTHON_VU,
    '',
    'Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour et sans bloc de code Markdown.',
    'Les retours à la ligne dans les chaînes sont échappés en \\n.'
  ].join('\n');

  /* Gabarits JSON par type : champs attendus + consigne de rédaction. */
  var TEMPLATES = {
    ecrire: {
      goal: "L'étudiant doit RÉDIGER lui-même un algorithme en pseudo-code. Tu poses donc le problème, sans montrer d'algorithme.",
      shape: {
        titre: 'titre court de l\'exercice (5 à 8 mots)',
        contexte: 'situation concrète en 1 à 3 phrases posant le décor (ou null si domaine abstrait)',
        enonce: "ce que l'algorithme doit faire, formulé précisément, 2 à 4 phrases",
        entrees: [{ nom: 'nom de la donnée', description: 'nature et contraintes de cette donnée' }],
        sortie: "description de la valeur produite par l'algorithme",
        consignes: ["consignes de rédaction, par ex. « écrire l'algorithme en pseudo-code », « utiliser une boucle bornée »"],
        aide: 'une phrase de piste méthodologique qui NE donne PAS la solution, ou null'
      },
      rules: [
        'Ne mets AUCUN pseudo-code et AUCUN code Python dans la réponse.',
        "Les champs algorithme et code_python doivent valoir null.",
        "Le problème doit se résoudre par un algorithme d'une dizaine de lignes au maximum."
      ]
    },

    derouler: {
      goal: "L'étudiant reçoit un algorithme et doit le DÉROULER à la main pour des valeurs d'entrée données, puis dire ce qui est renvoyé.",
      shape: {
        titre: 'titre court de l\'exercice',
        contexte: 'à quoi sert cet algorithme, 1 à 2 phrases (ou null)',
        enonce: "consigne de déroulement, par ex. « Dérouler l'algorithme suivant pour chacun des jeux de valeurs proposés, en indiquant la valeur de chaque variable à chaque tour de boucle. »",
        algorithme: 'le pseudo-code complet, respectant les conventions, avec Entrée/Sortie/Début/Fin',
        cas: ["jeux de valeurs d'entrée, un par élément, par ex. « n = 4 », « a = 3, b = 7 », « L = [4, 1, 7] » ou « D = {\"a\": 2, \"b\": 5} », inclure un cas limite"],
        consignes: ['éventuelles précisions sur la forme de la réponse attendue'],
        aide: 'conseil de méthode (par ex. tenir un tableau de suivi des variables), sans révéler de résultat, ou null'
      },
      rules: [
        "L'algorithme doit être court (6 à 14 lignes) et se dérouler en peu de tours de boucle (au plus 6).",
        'Propose 2 ou 3 jeux de valeurs, dont un cas particulier intéressant (valeur nulle, liste à un seul élément, boucle jamais exécutée, condition jamais vraie…).',
        "Si l'algorithme contient des « Lire », le jeu de valeurs doit donner, dans l'ordre, les valeurs saisies.",
        "N'indique jamais ce que renvoie l'algorithme, ni aucune valeur intermédiaire.",
        'Le champ code_python doit valoir null.'
      ]
    },

    traduire: {
      goal: "L'étudiant reçoit un algorithme en pseudo-code et doit le TRADUIRE en Python.",
      shape: {
        titre: 'titre court de l\'exercice',
        contexte: 'ce que calcule cet algorithme, 1 à 2 phrases (ou null)',
        enonce: "consigne de traduction, 1 à 3 phrases, précisant par ex. d'écrire une fonction Python",
        algorithme: 'le pseudo-code complet, respectant les conventions, avec Entrée/Sortie/Début/Fin',
        consignes: ["précisions : nom de la fonction attendue, paramètres, ce que la fonction doit renvoyer, appel de test à écrire"],
        aide: 'rappel de correspondance utile (par ex. « Pour i de 1 à n » se traduit avec range), sans écrire la traduction, ou null'
      },
      rules: [
        "Le pseudo-code doit mobiliser les notions demandées et faire 8 à 16 lignes.",
        "N'écris AUCUNE ligne de Python : le champ code_python doit valoir null.",
        "Si tu donnes un nom de fonction attendu, mets-le dans consignes, pas sous forme de code."
      ]
    },

    lire: {
      goal: "L'étudiant reçoit un programme Python et doit dire ce qu'il produit (valeur renvoyée ou affichage).",
      shape: {
        titre: 'titre court de l\'exercice',
        contexte: 'mise en situation en 1 à 2 phrases (ou null)',
        enonce: "consigne de lecture, par ex. « Lire le programme suivant et indiquer ce qu'il affiche. »",
        code_python: 'le programme Python complet, indenté avec 4 espaces, prêt à être lu',
        questions: ["questions précises, par ex. « Que renvoie calculer(5) ? », « Qu'affiche le programme si n vaut 0 ? »"],
        consignes: ['précisions éventuelles sur la forme de la réponse (ou tableau vide)'],
        aide: "conseil de lecture (par ex. suivre l'évolution de la variable compteur), sans donner de résultat, ou null"
      },
      rules: [
        "Le programme fait 8 à 18 lignes, sans import, sans input() — le résultat doit être entièrement déterminé par le code lui-même — et se termine par un ou deux appels dont les valeurs sont écrites en clair.",
        'Le programme doit être CORRECT et lisible : le but est la lecture, pas la chasse au bug.',
        'Pose 2 à 4 questions, dont une sur un cas particulier.',
        "Ne donne jamais la réponse aux questions. Le champ algorithme doit valoir null.",
        "N'écris pas de commentaire Python qui révélerait le résultat."
      ]
    }
  };

  function listNotions(notions) {
    if (!notions || !notions.length) {
      return "Notions : au choix parmi les bases (variables, affectation, conditionnelle, boucle bornée).";
    }
    return 'Notions à mobiliser impérativement : ' + notions.join(', ') +
      ".\nN'introduis aucune notion nettement plus avancée que celles-ci.";
  }

  /* Les notions exclues n'ont pas encore été vues en cours : leur seule apparition
     rend l'exercice inutilisable, d'où une consigne répétée et placée en fin de prompt. */
  function excludeLines(exclusions) {
    if (!exclusions || !exclusions.length) return [];
    return [
      '',
      'NOTIONS INTERDITES : ' + exclusions.join(', ') + '.',
      "Ces notions n'ont pas encore été vues par les étudiants. Elles ne doivent apparaître",
      "nulle part : ni dans le contexte, ni dans l'énoncé, ni dans les entrées ou la sortie,",
      "ni dans l'algorithme, ni dans le code Python, ni dans les jeux de valeurs, ni dans les",
      'consignes ou la piste. Si le sujet auquel tu penses en a besoin, change de sujet.'
    ];
  }

  /* Certaines notions produisent, sans consigne dédiée, un exercice où la notion
     est présente mais ne sert à rien. Elles reçoivent ici des exigences propres,
     dont un relèvement des limites de longueur : ce sont elles qui poussaient le
     modèle à tout regrouper dans une seule fonction. */
  var NOTION_GUIDES = {
    fonction: {
      match: /fonction/,
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « fonctions » est demandée.',
        "Une seule fonction contenant toute la solution et appelée une seule fois ne fait PAS",
        "travailler la notion : c'est le piège à éviter. La fonction doit être nécessaire.",
        "Choisis l'une de ces trois formes :",
        '  (a) une fonction appelée PLUSIEURS FOIS avec des arguments différents,',
        '      typiquement à l\'intérieur d\'une boucle, ou sur deux ou trois valeurs distinctes ;',
        "  (b) DEUX fonctions, la première appelant la seconde, le programme principal",
        "      n'appelant que la première ;",
        '  (c) une fonction qui évite de répéter le même calcul à deux endroits différents.',
        'Dans tous les cas :',
        '- le programme principal subsiste et fait quelque chose : préparer les données,',
        '  appeler la ou les fonctions, puis afficher ou renvoyer le résultat ;',
        "- les paramètres de la fonction portent des noms DIFFÉRENTS des variables du",
        '  programme principal : c\'est ce qui rend visible le passage des arguments ;',
        '- la fonction renvoie une valeur, elle ne se contente pas d\'afficher ;',
        '- la fonction reste courte (2 à 5 lignes de corps) et a un rôle qu\'on peut nommer.',
        "Les limites de longueur indiquées plus haut sont relevées à une vingtaine de lignes",
        'au total, fonctions comprises : ne sacrifie pas la structure pour tenir en peu de lignes.'
      ],
      byType: {
        ecrire: "L'énoncé dit explicitement combien de fonctions écrire et ce que chacune doit " +
          'faire (nom, paramètres, valeur renvoyée), puis demande de les utiliser dans le corps principal.',
        derouler: "Le déroulement doit traverser AU MOINS DEUX appels de la fonction avec des arguments " +
          "différents : c'est là que se joue la compréhension. Les jeux de valeurs sont ceux du " +
          'programme principal, pas ceux de la fonction.',
        traduire: "L'algorithme fourni contient déjà la ou les fonctions, déclarées avant le corps " +
          'principal ; la consigne demande de traduire chaque fonction par un def distinct.',
        lire: 'Le programme comporte au moins une fonction appelée plusieurs fois, et une question ' +
          "porte sur un appel isolé (« que renvoie f(3) ? »), une autre sur ce qu'affiche l'ensemble."
      }
    },

    recursivite: {
      match: /recursi/,
      /* La consigne « fonctions » propose d'appeler la fonction dans une boucle,
         que celle-ci interdit : elle la remplace au lieu de s'y ajouter. */
      supersedes: ['fonction'],
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « récursivité » est demandée.',
        "La fonction doit s'appeler elle-même : une boucle déguisée en fonction ne fait pas",
        'travailler la notion. Structure imposée par le cours, dans cet ordre :',
        '  1. le ou les CAS D\'ARRÊT, testés en premier, qui renvoient sans nouvel appel',
        '     (liste vide, n = 0, valeur trouvée…) ;',
        "  2. le CAS GÉNÉRAL, qui rappelle la fonction avec des paramètres qui se RAPPROCHENT",
        "     du cas d'arrêt (liste amputée d'un élément, n − 1, moitié de l'intervalle…) ;",
        "  3. la combinaison du résultat de l'appel avec le travail du niveau courant,",
        '     par ex. « Renvoyer r + 1 » ou « Renvoyer n × Factorielle(n − 1) ».',
        'Autres exigences :',
        "- l'algorithme ne doit contenir AUCUNE boucle : c'est la récursion qui remplace la boucle ;",
        '- la terminaison doit être évidente : chaque appel réduit strictement le problème ;',
        '- reste sur un cas simple et déroulable à la main : au plus 4 ou 5 appels imbriqués.',
        'Les limites de longueur indiquées plus haut sont relevées à une vingtaine de lignes.'
      ],
      byType: {
        ecrire: "L'énoncé exige explicitement une solution RÉCURSIVE et interdit la boucle ; il peut " +
          "rappeler qu'il faut identifier le cas d'arrêt et le cas général.",
        derouler: "Les jeux de valeurs doivent déclencher 3 ou 4 appels imbriqués, plus un cas qui tombe " +
          "directement dans le cas d'arrêt. La consigne demande de suivre les appels successifs, " +
          'puis les valeurs renvoyées en remontant.',
        traduire: "L'algorithme fourni est récursif ; la consigne signale que la fonction Python devra " +
          "s'appeler elle-même, sans introduire de boucle.",
        lire: "Le programme est récursif ; une question porte sur un appel qui atteint immédiatement le " +
          "cas d'arrêt, une autre sur un appel qui en déclenche plusieurs."
      }
    },

    matrices: {
      match: /matrice|listes? de listes/,
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « listes de listes (matrices) » est demandée.',
        'Une seule liste plate ne fait PAS travailler la notion : la donnée doit être',
        'véritablement à DEUX DIMENSIONS, un tableau de lignes et de colonnes.',
        'Exigences :',
        '- la donnée est une liste dont CHAQUE élément est lui-même une liste, toutes de même',
        '  longueur : M = [[1, 2, 3], [4, 5, 6]] est une matrice de 2 lignes et 3 colonnes ;',
        "- le sujet doit être naturellement à deux dimensions (grille de jeu, emploi du temps,",
        '  notes de plusieurs élèves à plusieurs contrôles, relevés sur plusieurs jours et',
        "  plusieurs capteurs, damier…) : si une seule liste suffirait, change de sujet ;",
        "- l'algorithme distingue M[i], qui est une LIGNE entière (donc une liste), de M[i][j],",
        '  qui est une CASE : c\'est exactement le point que l\'exercice doit faire comprendre ;',
        '- le parcours se fait avec deux boucles imbriquées, celle de l\'extérieur sur les lignes,',
        "  celle de l'intérieur sur les colonnes — ou bien « Pour chaque ligne dans M » puis",
        '  « Pour chaque valeur dans ligne » ;',
        '- la limite de taille indiquée plus haut s\'applique PAR LIGNE : la matrice fait 2 à 4',
        '  lignes et 2 à 4 colonnes, jamais davantage, pour rester déroulable à la main.'
      ],
      byType: {
        ecrire: "L'énoncé précise ce que représentent les lignes et ce que représentent les colonnes, " +
          'et si les dimensions sont données en entrée ou déduites de la matrice.',
        derouler: 'Chaque jeu de valeurs donne la matrice complète, écrite en extension, par ex. ' +
          '« M = [[3, 1], [2, 4]] ». Prévois un cas où toutes les lignes ne se comportent pas ' +
          'pareil, pour que le parcours des deux dimensions se voie.',
        traduire: "L'algorithme fourni contient les deux boucles imbriquées et des accès M[i][j].",
        lire: 'Le programme construit la matrice en clair au début, et une question porte sur une ' +
          "case précise, une autre sur un résultat agrégé (une somme par ligne, un maximum global…)."
      }
    },

    classes: {
      match: /classe|objet/,
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « classes et objets » est demandée.',
        'Une classe qui se contente de ranger des valeurs, sans opération dessus, ne fait pas',
        'travailler la notion. Exigences :',
        '- la classe a au moins deux attributs et au moins deux méthodes qui font quelque chose',
        '  des attributs (les modifier, les combiner, répondre à une question à leur sujet) ;',
        "- l'exercice crée AU MOINS DEUX objets de la classe et enchaîne des appels de méthodes",
        "  sur eux : c'est ce qui montre que chaque objet a son propre état ;",
        '- au moins une méthode MODIFIE un attribut, pour que cet état évolue de façon visible ;',
        '- choisis un objet du domaine qui a naturellement un état et des opérations (compte,',
        '  panier, joueur, capteur, nœud…), pas une simple fiche de données.',
        'Les limites de longueur sont relevées à une vingtaine de lignes, classe comprise.'
      ],
      byType: {
        ecrire: "L'énoncé donne le nom de la classe, la liste des attributs et le rôle de chaque " +
          "méthode à écrire, puis demande un court programme principal qui crée deux objets et les utilise.",
        derouler: "Le déroulement porte sur l'état des objets : la consigne demande de suivre, après " +
          "chaque appel, la valeur des attributs de CHAQUE objet. Prévois un appel sur le second objet " +
          'pour vérifier que les états ne se mélangent pas.',
        traduire: "L'algorithme fourni contient la classe complète et son utilisation ; la consigne " +
          'rappelle que le constructeur se traduit par __init__ et que chaque méthode prend self.',
        lire: "Le programme définit la classe puis crée deux objets ; une question porte sur la valeur " +
          "d'un attribut après une série d'appels, une autre sur ce qu'affiche l'ensemble."
      }
    },

    heritage: {
      match: /herit/,
      /* Reprend l'essentiel de la consigne « classes » : les deux ensemble
         feraient un bloc trop long, et l'héritage suppose déjà tout cela. */
      supersedes: ['classes'],
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « héritage entre classes » est demandée.',
        'Une seule classe, ou deux classes sans lien réel, ne font pas travailler la notion.',
        'Exigences :',
        '- DEUX classes au minimum, la seconde déclarée comme fille de la première ;',
        "- la classe mère porte un attribut et une méthode qui ont du sens pour toutes ses filles ;",
        '- la classe fille AJOUTE quelque chose : un attribut de plus, une méthode de plus, ou',
        '  une méthode de la mère redéfinie — sinon l\'héritage ne sert à rien ;',
        "- le constructeur de la fille appelle celui de la mère (« super.Constructeur(…) ») ;",
        "- le point à faire comprendre est qu'on appelle sur un objet fille une méthode qu'il",
        "  n'a pas déclarée : l'exercice DOIT contenir un tel appel, hérité de la mère ;",
        '- reste sur deux classes, trois au maximum, et des calculs simples.',
        'Les limites de longueur sont relevées à une vingtaine de lignes, classes comprises.'
      ],
      byType: {
        derouler: "Un des appels à dérouler doit être un appel hérité, non redéclaré dans la classe fille.",
        lire: "Une question porte sur un appel hérité, une autre sur une méthode redéfinie.",
        ecrire: "L'énoncé dit quelle classe hérite de quelle autre, et ce que la fille ajoute."
      }
    },

    modules: {
      match: /module|bibliotheque|package/,
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « modules et bibliothèques » est demandée.',
        "Par exception à la règle générale, l'import d'un module est ici autorisé et attendu.",
        'Exigences :',
        '- un seul module, de la bibliothèque standard, au comportement parfaitement prévisible',
        '  (math surtout ; time seulement pour une lecture, jamais random) ;',
        "- le programme reste déterministe : rien qui dépende de l'heure ou du hasard ;",
        "- l'import est en première ligne, et la ou les fonctions importées sont utilisées",
        '  plusieurs fois, avec un commentaire indiquant ce que chacune renvoie ;',
        "- en pseudo-code, un module ne s'écrit pas : la fonction est alors considérée comme",
        "  déjà disponible, et l'énoncé le précise en français."
      ],
      byType: {
        lire: "Malgré la contrainte « sans import » indiquée plus haut, ce programme DOIT comporter " +
          'un import ; une question porte sur ce que renvoie la fonction importée.'
      }
    },

    complexite: {
      match: /complexit/,
      common: [
        'EXIGENCE PARTICULIÈRE — la notion « complexité algorithmique » est demandée.',
        "La complexité ne se déroule pas : elle se COMPTE puis se nomme. L'exercice doit donc,",
        "en plus de son travail habituel, faire compter des opérations et nommer la classe de",
        'complexité, parmi O(1), O(log n), O(n), O(n log n) et O(n²).',
        'Exigences :',
        "- la complexité de l'algorithme doit être lisible et sans ambiguïté : une boucle simple",
        '  sur n éléments donne O(n), deux boucles imbriquées O(n²), une dichotomie O(log n) ;',
        "- ce qu'il faut compter est nommé explicitement (nombre de comparaisons, nombre de tours",
        '  de boucle, nombre d\'appels), jamais « le nombre d\'opérations » sans précision ;',
        "- si l'algorithme peut s'arrêter par anticipation, distingue le meilleur cas du pire cas ;",
        '- n désigne toujours la taille de l\'entrée, et l\'énoncé le dit.'
      ],
      byType: {
        derouler: "Ajoute aux jeux de valeurs une ou deux questions : le nombre de comparaisons " +
          "effectuées pour une liste de n éléments, puis la classe de complexité correspondante.",
        lire: 'Une question demande le nombre de tours de boucle en fonction de n, une autre la classe ' +
          'de complexité.',
        ecrire: "Les consignes demandent, après l'algorithme, d'indiquer sa complexité et de la justifier " +
          'en une phrase.',
        traduire: "Les consignes demandent, après la traduction, d'indiquer la complexité de l'algorithme."
      }
    },

    pileFile: {
      match: /pile|file|fifo|lifo/,
      common: [
        'EXIGENCE PARTICULIÈRE — une pile ou une file est demandée.',
        "L'intérêt de ces structures est la DISCIPLINE d'accès : c'est elle qu'il faut faire travailler.",
        '- une file se remplit par la fin et se vide par le début (premier entré, premier sorti) ;',
        '- une pile se remplit et se vide par la même extrémité (dernier entré, premier sorti) ;',
        "- on n'accède JAMAIS à un élément par son indice, ni au milieu de la structure :",
        '  uniquement ajouter/retirer pour une file, empiler/dépiler pour une pile ;',
        '- avant de retirer ou de dépiler, on teste que la structure n\'est pas vide ;',
        "- le sujet doit rendre l'ordre observable : l'exercice n'a d'intérêt que si l'on voit",
        "  que l'ordre de sortie diffère (pile) ou non (file) de l'ordre d'entrée."
      ],
      byType: {
        derouler: "Le déroulement doit demander l'état de la pile ou de la file après chaque opération, " +
          'et pas seulement le résultat final.',
        lire: "Une question porte sur l'ordre dans lequel les éléments sortent."
      }
    }
  };

  function notionGuideLines(notions, type) {
    var haystack = (notions || []).join(' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    var keys = Object.keys(NOTION_GUIDES).filter(function (key) {
      return NOTION_GUIDES[key].match.test(haystack);
    });

    /* Une consigne peut en remplacer une autre quand les deux se contredisent. */
    var dropped = {};
    keys.forEach(function (key) {
      (NOTION_GUIDES[key].supersedes || []).forEach(function (other) { dropped[other] = true; });
    });

    var lines = [];
    keys.filter(function (key) { return !dropped[key]; }).forEach(function (key) {
      var guide = NOTION_GUIDES[key];
      lines = lines.concat([''], guide.common);
      if (guide.byType[type]) lines.push('- ' + guide.byType[type]);
    });
    return lines;
  }

  function domainLine(domain, exclusions) {
    var banned = (exclusions || []).join(' ').toLowerCase();
    var material = [];
    material.push('des nombres');
    if (banned.indexOf('liste') === -1 && banned.indexOf('tableau') === -1) material.push('des listes');
    if (banned.indexOf('chaîne') === -1 && banned.indexOf('chaine') === -1) material.push('des chaînes');

    if (!domain) {
      return "Domaine : aucun. L'exercice reste abstrait : il manipule " + material.join(' ou ') +
        ' sans mise en situation, avec des noms de variables neutres.';
    }
    return 'Domaine : ' + domain + ". L'exercice doit être situé de façon crédible dans ce domaine " +
      '(vocabulaire, grandeurs et noms de variables cohérents), sans exiger de connaissances spécialisées.';
  }

  var LEVELS = {
    'découverte': "Niveau : découverte. Une seule structure de contrôle, très peu de variables, énoncé très guidé.",
    'intermédiaire': "Niveau : intermédiaire. Deux structures combinées au maximum, énoncé guidé mais qui laisse réfléchir.",
    'avancé': "Niveau : avancé (pour un débutant). Combinaison de plusieurs structures, cas particuliers à considérer, énoncé plus sobre."
  };

  /* params : { type, domain, notions[], level, avoid[], seed } */
  function build(params) {
    var tpl = TEMPLATES[params.type];
    if (!tpl) throw new Error("Type d'exercice inconnu : " + params.type);

    var user = [
      "Génère UN exercice.",
      '',
      'But du type demandé : ' + tpl.goal,
      '',
      domainLine(params.domain, params.exclusions),
      listNotions(params.notions)
    ]
      .concat(excludeLines(params.exclusions))
      .concat([
        '',
        LEVELS[params.level] || LEVELS['intermédiaire'],
        '',
        'Contraintes propres à ce type :',
        tpl.rules.map(function (r) { return '- ' + r; }).join('\n')
      ])
      .concat(notionGuideLines(params.notions, params.type))
      .concat([
        '',
        'Structure JSON attendue (respecte exactement les noms de clés ; mets null ou [] pour ce qui ne s\'applique pas) :',
        JSON.stringify(tpl.shape, null, 2),
        '',
        'Rappel : aucune solution, aucun résultat, aucun corrigé, même partiel.'
      ]);

    if (params.exclusions && params.exclusions.length) {
      user.push('Rappel : ' + params.exclusions.join(', ') + ' — à proscrire complètement.');
    }

    if (params.avoid && params.avoid.length) {
      user.push('', "Évite de reprendre ces sujets déjà proposés : " + params.avoid.join(' ; ') + '.');
    }
    user.push('', 'Graine de variation (utilise-la pour choisir un sujet différent) : ' + (params.seed || Math.random()));

    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user.join('\n') }
    ];
  }

  global.Prompts = { build: build, SYSTEM: SYSTEM, NOTION_GUIDES: NOTION_GUIDES };
})(window);
