/**
 * French dictionary.
 *
 * Typed against `Dict` (inferred from the English file), so a missing or renamed key is a
 * compile error rather than a silent fallback.
 *
 * Several entries are functions rather than templates because French needs decisions
 * English does not: agreement in number, elision, and the singular forms that "Aucun X
 * n'est un Y" requires where English says "No Xs are Ys".
 */
import type { Dict } from './index';

/** Strips the plural marker from an invented category name: "Blicks" -> "Blick". */
function sing(term: string): string {
  return term.endsWith('s') ? term.slice(0, -1) : term;
}

/** French shape names are all regular except "croix", which is invariable. */
function plural(word: string, count: number): string {
  if (count === 1) return word;
  return word.endsWith('x') || word.endsWith('s') ? word : `${word}s`;
}

const fr: Dict = {
  locale: {
    htmlLang: 'fr',
    nativeName: 'Français',
    intl: 'fr-FR',
  },

  nav: {
    brand: 'Muscle Tes Neurones',
    home: 'Accueil',
    practice: 'Entraînement',
    sprint: 'Contre-la-montre',
    test: 'Test complet',
    progress: 'Progression',
    about: 'À propos',
    mainNav: 'Principale',
    skipToContent: 'Aller au contenu',
    languageLabel: 'Langue',
    switchTo: (name: string) => `Passer en ${name}`,
  },

  footer: {
    generated:
      'Chaque item est produit par un algorithme et vérifié pour n’admettre qu’une seule réponse défendable. Aucun item d’un test publié n’est reproduit ici.',
    noScore:
      'Ceci est un entraînement, pas une évaluation. Aucun score de QI n’est affiché, faute d’étalonnage auquel le comparer.',
    whyItMatters: 'Pourquoi cela compte',
    terms: 'Conditions d’utilisation',
  },

  domains: {
    Gf: 'Raisonnement fluide',
    Gc: 'Connaissances acquises',
    Gv: 'Traitement visuel',
    Gwm: 'Mémoire de travail',
    Gs: 'Vitesse de traitement',
    Gq: 'Raisonnement quantitatif',
    Gt: 'Vitesse de réaction et de décision',
    Glr: 'Stockage et récupération à long terme',
  },

  /**
   * Les espaces avant le symbole sont insécables : sans cela, une poignée de pièces se coupe entre
   * le nombre et son unité en fin de ligne, et « 1 » se retrouve seul au-dessus de « c ».
   */
  money: {
    amount: (units: number) =>
      units % 100 === 0
        ? `${units / 100}\u00a0€`
        : units < 100
          ? `${units}\u00a0c`
          : `${(units / 100).toFixed(2).replace('.', ',')}\u00a0€`,
    coin: (units: number) => (units >= 100 ? `${units / 100}\u00a0€` : `${units}\u00a0c`),
    coins: (units: number[]) =>
      units.map((c) => (c >= 100 ? `${c / 100}\u00a0€` : `${c}\u00a0c`)).join(' + '),
  },

  calendar: {
    days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  },

  clock: {
    /** L’usage français écrit « 3 h 40 » ; le zéro initial garde toutes les réponses de même longueur. */
    time: (hour: number, minute: number) =>
      `${String(hour).padStart(2, '0')} h ${String(minute).padStart(2, '0')}`,
    faceLabel: (time: string) => `Une horloge indiquant ${time}`,
    turnedFaceLabel: (rotation: number, hourAngle: number, minuteAngle: number) =>
      `Un cadran tourné de ${rotation} degrés dans le sens horaire, chiffres compris. Mesurée depuis le haut de l’écran, la petite aiguille pointe à ${hourAngle} degrés dans le sens horaire, et la grande à ${minuteAngle} degrés.`,
    firstFace: 'Le cadran le plus tôt',
    secondFace: 'Le cadran le plus tard',
  },

  quiz: {
    preparing: 'Préparation des items…',
    level: (n: number) => `Niveau ${n}`,
    progress: (current: number, total: number) => `${current} sur ${total}`,
    answerOptions: 'Réponses proposées',
    optionLabel: (n: number, description: string) => `Réponse ${n} : ${description}`,
    tip: (max: number) => ({
      before: 'Astuce : appuyez sur ',
      after: ' pour répondre.',
      first: '1',
      last: String(max),
    }),
    correct: 'Correct',
    notQuite: 'Pas tout à fait',
    next: 'Suivant',
    seeResults: 'Voir les résultats',
    youTyped: (value: string) => `Vous avez saisi ${value}.`,
    nothing: '(rien)',
    yourAnswer: 'Votre réponse',
    typeSequence: 'Saisissez la séquence',
    watching: 'Observez…',
    submit: 'Valider',
    nowTypeItBack: 'À vous de la saisir.',
    spanReady: (length: number) =>
      `${length} caractères, un à la fois. Chacun disparaît au passage — puis vous les saisissez.`,
    spanStart: 'Lancer la séquence',
    nBackReady: (length: number, n: number) =>
      `${length} lettres, une à la fois. Comptez celles qui reprennent la lettre ${n === 1 ? 'précédente' : `apparue ${n} rangs plus tôt`}.`,
    nBackDone: 'Combien y en avait-il ?',
    headCountReady: (events: number) =>
      `${events} mouvements, un à la fois. Des personnages entrent, d’autres sortent — gardez le compte de ceux qui sont dans la salle.`,
    headCountDone: 'Combien en restait-il ?',
    mathRecallReady: (terms: number) =>
      `${terms} nombres, un à la fois. Chacun disparaît avant l’arrivée du suivant — ensuite vous donnez leur total.`,
    mathRecallDone: 'Donnez le total.',
    highNumber: {
      candidateLabel: (side: string, value: number) => `${side} : ${value}`,
      left: 'Gauche',
      right: 'Droite',
    },
    pyramid: {
      cellLabel: (n: number, total: number) =>
        `Case ${n} sur ${total}, en partant de la rangée du bas`,
      progress: (filled: number, total: number) => `${filled} sur ${total} remplies`,
    },

    hands: {
      shownLabel: (hand: string) => `La main montrée : ${hand}`,
      rock: 'pierre',
      paper: 'feuille',
      scissors: 'ciseaux',
    },
    sprint: {
      ready: (seconds: number) =>
        `${seconds} secondes, autant d’items que possible. Le chronomètre part quand vous partez.`,
      readyNote:
        'Aucune explication avant la fin : répondre enchaîne directement sur l’item suivant. Le niveau reste fixe pour tout le bloc, ce qui rend deux séries comparables.',
      start: 'Lancer le chronomètre',
      done: (n: number) => `${n} traité${n === 1 ? '' : 's'}`,
      nothing: 'Le temps s’est écoulé avant la moindre réponse.',
      again: 'Réessayer',
    },
    headCount: {
      arriving: (n: number) => `${n} qui ${n === 1 ? 'entre' : 'entrent'}`,
      leaving: (n: number) => `${n} qui ${n === 1 ? 'sort' : 'sortent'}`,
      roomLabel: 'La salle',
    },
    tower: {
      startLabel: 'Maintenant',
      goalLabel: 'Voulu',
      pegLabel: (peg: number, holds: number) => `Tige ${peg}, ${holds} place${holds > 1 ? 's' : ''}`,
      emptyPeg: 'vide',
      beadLabel: (shape: string) => `perle ${shape}`,
    },
    table: {
      cornerLabel: 'Équipe',
    },
    weights: {
      premisesLabel: 'Ces balances s’équilibrent',
      targetLabel: 'Équilibrez celle-ci',
      premiseLabel: (n: number) => `Balance équilibrée ${n}`,
    },
    coding: {
      keyLabel: 'Légende',
      probeLabel: 'Cherchez ce chiffre',
      pairLabel: (digit: string, description: string) => `Le ${digit} est associé à ${description}`,
    },
    missingCell: 'case manquante',
    missingFigure: 'figure manquante',
    patternMatrix: 'Matrice de motifs',
    cellLabel: (n: number, description: string) => `Case ${n} : ${description}`,
    figureLabels: {
      first: 'Première figure',
      second: 'Deuxième figure',
      third: 'Troisième figure',
      target: 'Forme cible',
      targets: 'Cibles',
      searchGroup: 'Groupe à examiner',
      sheetBefore: 'La feuille avant pliage',
      sheetFolded: 'La feuille pliée, avec les perforations',
      sheet: 'feuille',
      punched: 'perforée',
      foldStep: (fold: string) => `pli ${fold}`,
      leftPanel: 'Panneau de gauche',
      rightPanel: 'Panneau de droite',
      step: (n: number) => `Étape ${n}`,
      layers: (n: number) => `${n} épaisseurs`,
      foldFrameLabel: (n: number, description: string) => `Étape ${n} : ${description}`,
      punchedFrameLabel: (layers: number) =>
        `La feuille pliée, ${layers} épaisseurs, avec les perforations`,
    },
    describeFigure: (count: number, shape: string, size: number, shading: string) =>
      `${count} ${plural(shape, count)}, taille ${size}, ${shading}`,
    describeGrid: (rows: string[], filled: number) =>
      `${filled} cases : ${rows.map((row, i) => `ligne ${i + 1} ${row || 'vide'}`).join(', ')}`,
    gridRowCells: (columns: number[]) => listPhrase(columns.map(String), 'et'),
    listSeparator: ' et ',
    turnedBy: (degrees: number) => `tournée de ${degrees} degrés`,
    atPositions: (positions: number[], total: number) =>
      `en position${positions.length === 1 ? '' : 's'} ${listPhrase(positions.map(String), 'et')} sur ${total}`,
    emptyCell: 'une case vide',
    unfilled: 'sans remplissage',
    shadingLevel: (n: number) => `remplissage niveau ${n}`,
    shapeNames: {
      circle: 'cercle',
      square: 'carré',
      triangle: 'triangle',
      diamond: 'losange',
      pentagon: 'pentagone',
      hexagon: 'hexagone',
      star: 'étoile',
      cross: 'croix',
    },
  },

  /**
   * Les répliques de la mascotte. Voir `en.ts` pour les règles auxquelles se tient ce texte.
   *
   * Traduites plutôt que transposées mot à mot : la contrainte de longueur est plus dure ici,
   * le français étant régulièrement d’un cinquième plus long que l’anglais, et une bulle qui
   * passe à trois lignes en français seulement déplace tout le panneau.
   */
  mascot: {
    name: 'Neurone',
    lines: {
      home: ['Quand vous voulez.', 'Choisissez un format, on commence.'],
      practice: ['Tous les formats, un par un.', 'Commencez où vous voulez : tout se régénère.'],
      correct: [
        'C’est exactement la règle.',
        'Vous l’avez lue de bout en bout.',
        'Celle-ci a tenu.',
        'Règle repérée.',
      ],
      wrong: [
        'Pas celle-ci. La règle est juste dessous.',
        'À relire — c’est expliqué dessous.',
        'Tout près. Voici ce qui se jouait.',
        'Ça arrive. La raison est juste là.',
      ],
      results: ['Un bloc de terminé.', 'Bloc entier, derrière vous.'],
      progressEmpty: [
        'Rien d’enregistré pour l’instant.',
        'Aucune série : les courbes se remplissent au fil du temps.',
      ],
    },
  },

  /** L’aide-mémoire des raccourcis clavier. */
  shortcuts: {
    open: 'Raccourcis clavier',
    hint: 'Appuyez sur ? pour les raccourcis clavier',
    heading: 'Raccourcis clavier',
    lede: 'Une série entière peut se faire sans toucher la souris.',
    close: 'Fermer',
    keys: {
      numbers: 'Choisir une réponse',
      enter: 'Lancer une séquence, ou passer à l’item suivant',
      tab: 'Se déplacer entre les réponses',
      question: 'Afficher ou masquer cette liste',
      escape: 'Fermer cette liste',
    },
    range: (first: string, last: string) => ({ first, last }),
  },

  /** Textes des cartes de partage générées au build. */
  og: {
    disclaimer: 'Entraînement, pas évaluation. Jamais de score de QI.',
  },

  /**
   * La graine, promue du statut de paramètre d’URL à celui d’objet visible et partageable.
   */
  seed: {
    label: 'Graine',
    copy: 'Copier le lien qui rejoue cette série',
    copyShort: 'Copier le lien',
    copied: 'Lien copié',
    copyFailed: 'Copie impossible — sélectionnez la graine et copiez-la à la main.',
    concealed:
      'Masquée pendant la réponse — la graine régénère l’item. Elle revient à la correction.',
    explain:
      'Cette graine de huit caractères contient toute la série. Qui ouvre le lien copié obtient exactement ces items, dans la langue qu’il lit — rien n’est stocké sur un serveur, puisque la graine régénère les items sur sa propre machine.',
  },

  /**
   * La taxonomie des erreurs, en mots. Les libellés courts sont en minuscules : ce sont
   * des étiquettes, pas des phrases.
   */
  diagnosis: {
    heading: 'Où ça a dérapé',
    tags: {
      correct: 'correct',
      'wrong-rule': 'mauvaise règle',
      'wrong-axis': 'mauvais axe',
      'off-by-one': 'un pas de trop',
      copy: 'case recopiée',
      'wrong-attribute': 'mauvais attribut',
      mirror: 'image miroir',
      'wrong-direction': 'sens inversé',
      carry: 'report oublié',
      transposition: 'ordre perdu',
      premature: 'faux départ',
      commission: 'appui sur stop',
      omission: 'signal manqué',
      'opposite-faces': 'faces opposées',
      'wrong-turn': 'marque tournée',
      overshoot: 'trop à droite',
      undershoot: 'trop à gauche',
      plausible: 'presque juste',
    },
    bodies: {
      correct: 'Vous avez appliqué toutes les règles qui construisent cet item.',
      'wrong-rule':
        'Le bon attribut, mais la mauvaise règle. Vous avez repéré ce qui change, puis vous lui avez appliqué une autre transformation que celle sur laquelle l’item est bâti.',
      'wrong-axis':
        'La bonne règle, mais dans le mauvais sens : vous avez lu la colonne au lieu de la ligne. Ici les règles courent le long des lignes ; les colonnes ne semblent régulières que par ricochet.',
      'off-by-one':
        'La bonne règle, poussée d’un pas de trop — ou d’un pas de trop peu. Comptez les étapes au lieu d’estimer le point d’arrivée.',
      copy: 'Cette option ne fait que reprendre une figure déjà affichée. Ce qui est déjà visible ne peut pas être la pièce manquante.',
      'wrong-attribute':
        'Le mauvais attribut. Vous avez répondu sur une propriété réelle du stimulus — mais pas celle sur laquelle portait la question, et c’est ce qui rend l’erreur tentante plutôt que distraite. Dans un motif, cela revient à faire varier un attribut que la règle ne gouverne pas ; dans une tâche de comptage, à rapporter ce que disent les chiffres au lieu de leur nombre.',
      mirror:
        'C’est un reflet, pas une rotation. Choisissez un détail asymétrique et suivez-le : tourner conserve sa position relative, retourner l’inverse.',
      carry:
        'Le chiffre des unités est juste, un rang supérieur est faux. C’est la signature d’un report oublié ou compté deux fois — la part du calcul qui relève de la tenue de comptes plutôt que de l’arithmétique. C’est aussi pourquoi l’une des réponses fausses se termine toujours par le même chiffre que la bonne : sans cela, l’item pourrait se résoudre en ne calculant qu’un seul chiffre.',
      'wrong-direction':
        'La bonne quantité, mais dans le sens inverse. Vous teniez la taille du pas, mais vous l’avez appliqué à l’envers : ajouté ce qu’il fallait retrancher, ou l’inverse. Sur un flux qui ne se rejoue pas, un pas inversé coûte deux fois plus qu’un pas manqué.',
      premature:
        'Vous avez répondu avant le signal. C’est de l’anticipation, pas de la réaction : l’attente est aléatoire précisément pour qu’on ne puisse pas la chronométrer, et une réponse qui devance le signal était un pari sur le moment où il viendrait. Laissez le signal arriver ; une vraie réaction un peu plus lente est une mesure, un faux départ rapide n’en est pas une.',
      commission:
        'Vous avez appuyé sur un signal barré. C’est exactement l’échec d’inhibition que la tâche cherche à saisir : après une suite d’appuis, le suivant est à moitié lancé avant que le signal soit lu, et le signal barré arrive trop tard pour l’arrêter. Le remède n’est pas de regarder plus fort mais d’appuyer plus tard : quelques dizaines de millisecondes de délai sur chaque signal plein achètent le temps de se retenir sur le barré.',
      omission:
        'Vous avez laissé passer un signal plein sans appuyer. Pas un défaut de contrôle mais un relâchement : la suite a continué et, pour un signal, l’attention non. Dans une tâche go/no-go c’est l’erreur opposée à celle qu’on cherche, et si elle se répète c’est que le rythme est trop prudent : appuyez plus tôt et laissez les signaux barrés faire l’arrêt.',
      'opposite-faces':
        'Deux des faces montrées sont opposées sur le cube plié, si bien qu’on ne peut jamais les voir ensemble. C’est la première chose à établir sur un patron : deux carrés séparés par exactement un carré sur une ligne droite finissent toujours opposés, et chaque paire de ce genre élimine tout cube qui montre les deux.',
      'wrong-turn':
        'Les trois faces sont les bonnes, et leur ordre autour du coin aussi ; l’une des marques est tournée. Vous avez suivi quels carrés du patron se rejoignent, pas quelles arêtes. Sur un patron, l’arête qu’un carré partage avec son voisin est celle qui ne bouge pas au pliage — le haut d’une marque finit donc par pointer là où est partie l’arête qu’il visait. Choisissez une face, trouvez l’arête que sa marque désigne, et suivez cette arête.',
      overshoot:
        'La marque a dépassé la cible. Sur une longue droite, c’est la compression classique : les petits nombres semblent plus loin qu’ils ne sont, parce que le sens des grandeurs croît moins vite que les nombres. Ancrez-vous d’abord — trouvez le milieu, puis le quart — et placez la marque depuis l’ancre la plus proche plutôt que depuis l’extrémité gauche.',
      undershoot:
        'La marque s’est arrêtée avant la cible. Moins fréquent que le dépassement, et souvent le signe d’une correction excessive, ou d’une droite qui ne part pas de zéro lue comme si elle en partait. Fixez d’abord les deux extrémités, puis jugez la part du parcours plutôt que la grandeur du nombre.',
      transposition:
        'Tous les éléments, mais dans le désordre. Vous avez retenu ce qu’il y avait à retenir et vous en avez perdu l’agencement : c’est un autre échec que d’oublier un élément, et un échec plus encourageant, car dans une tâche d’empan le plus dur est d’ordinaire de retenir. L’ordre revient souvent avec un rythme délibéré : restituez la séquence à l’allure où elle vous a été donnée, plutôt qu’aussi vite que possible.',
      plausible:
        'Presque juste, sans diagnostic unique : cette option casse le motif de plusieurs façons à la fois, il n’y a donc pas une seule règle à corriger.',
    },
    optionTag: (tag: string) => `faux : ${tag}`,
    optionAria: (tag: string) => `Incorrect — ${tag}.`,
    answerLabel: 'La réponse',
  },

  results: {
    heading: 'Session terminée',
    sprintHeading: 'Terminé',
    sprintCorrectIn: (seconds: number) => `Justes en ${seconds} s`,
    sprintRate: 'Cadence',
    sprintAttempted: 'Sur les items tentés',
    perMinute: (n: number) => `${n}/min`,
    mistakesHeading: 'Comment vous vous êtes trompé',
    mistakesLede:
      'Chaque mauvaise réponse correspond à une lecture erronée précise, et la même revient souvent. C’est la seule chose vraiment utile à retenir d’une session.',
    mistakesNone: 'Rien à décomposer : vous avez tout juste.',
    commonestMistake: (tag: string, n: number, total: number) =>
      `${n} de vos ${total} mauvaise${total === 1 ? '' : 's'} réponse${total === 1 ? '' : 's'} ${n === 1 ? 'relève' : 'relèvent'} de la même erreur : ${tag}.`,
    mistakesSpread:
      'Vos erreurs se répartissent entre plusieurs types différents, sans qu’une habitude se dégage.',
    correct: 'Bonnes réponses',
    accuracy: 'Précision',
    medianTime: 'Temps médian',
    seed: 'Graine',
    byItemType: 'Par type d’item',
    colType: 'Type',
    colCorrect: 'Correctes',
    colAccuracy: 'Précision',
    disclaimerBefore:
      'Il s’agit de votre score sur ces items, pas d’un QI. Aucun étalonnage ne le sous-tend — voir ',
    disclaimerLink: 'ce que ce site mesure et ne mesure pas',
    disclaimerAfter: '.',
    goAgain: 'Recommencer',
    seeProgress: 'Voir la progression',
  },

  dashboard: {
    chanceLevel: (percent: string) => `hasard ${percent}`,
    switchHeading: 'Coût du basculement',
    switchLede:
      'Issu des plateaux à relier : de combien les plateaux mêlant nombres et lettres prennent plus de temps que ceux à nombres seuls. Les deux sortes exigent autant de recherche et de clics, si bien que l’écart mesure le coût de tenir deux suites à la fois et d’alterner entre elles — la part de la tâche qui n’est pas de la simple vitesse.',
    switchGap: 'Coût du basculement',
    switchFormA: (n: number) => `Nombres seuls (${n} plateaux)`,
    switchFormB: (n: number) => `Nombres et lettres (${n} plateaux)`,
    interferenceHeading: 'Interférence',
    interferenceLede:
      'Issu de l’épreuve de comptage : de combien vous ralentissez quand le chiffre contredit leur nombre. C’est le seul chiffre de cette page qui soit un écart et non un total, et l’écart est justement l’essentiel — tout le reste est identique entre les deux types d’essais, si bien qu’il ne subsiste que le coût de retenir la réponse offerte d’emblée par l’œil.',
    interferenceGap: 'Coût du conflit',
    interferenceCongruent: (n: number) => `Quand ils concordent (${n} essais)`,
    interferenceIncongruent: (n: number) => `Quand ils divergent (${n} essais)`,
    milliseconds: (n: number) => `${n > 0 ? '+' : ''}${n} ms`,
    interferenceExpected:
      'Un écart positif est le résultat ordinaire, et un écart important n’est pas un défaut : l’effet est robuste chez presque tout le monde, ce qui explique qu’on l’étudie depuis 1935.',
    interferenceUnexpected:
      'Un écart nul ou négatif signale le plus souvent un nombre d’essais insuffisant plutôt qu’une absence d’interférence. Il devrait redevenir positif à mesure qu’ils s’accumulent.',
    /** La lecture Gt : les deux formats de vitesse dans leurs propres unités. */
    gt: {
      heading: 'Réaction et contrôle',
      lede:
        'Issu des blocs de réaction et des séries go ou stop. Le temps de réaction est le seul chiffre de cette page qui soit un temps en lui-même plutôt que la durée d’un item : la médiane des essais de chaque bloc, puis la médiane de celles-ci. La pente est la loi de Hick lue sur vos propres niveaux — ce que chaque doublement des cibles ajoute. Le go ou stop se compte par type d’échec, car appuyer sur un signal barré et manquer un signal plein ne viennent pas du même endroit.',
      simple: (n: number) => `Temps de réaction simple (${n} bloc${n === 1 ? '' : 's'})`,
      slope: (n: number) => `Coût par doublement des cibles (${n} niveau${n === 1 ? '' : 'x'})`,
      perBit: (ms: number) => `${ms > 0 ? '+' : ''}${ms} ms`,
      commissions: (n: number) => `Appui sur un signal barré (${n} série${n === 1 ? '' : 's'})`,
      omissions: (n: number) => `Signal plein manqué (${n} série${n === 1 ? '' : 's'})`,
      notYet: 'pas encore',
      note:
        'Trois blocs sans faux départ à un niveau avant d’afficher son temps, deux niveaux de ce genre avant une pente, quatre séries avant les décomptes du go ou stop. Un bloc avec un faux départ n’est pas chronométré.',
    },
    gwm: {
      heading: 'Ce que vous pouvez retenir',
      lede:
        'Le niveau le plus haut que vous ayez réussi sur chaque format de mémoire de travail, dans l’unité propre du format plutôt qu’en niveau : chiffres, blocs, cases, profondeur de rappel, nombre de termes, nombre d’allées et venues. Ce sont les chiffres que rapporte la littérature — un empan de six chiffres à l’envers est celui du manuel.',
      units: {
        'digits-forward': (n: number) => `${n} chiffres à l’endroit`,
        'digits-backward': (n: number) => `${n} chiffres à l’envers`,
        blocks: (n: number) => `${n} bloc${n === 1 ? '' : 's'}`,
        squares: (n: number) => `${n} case${n === 1 ? '' : 's'}`,
        back: (n: number) => `${n} en arrière`,
        terms: (n: number) => `${n} terme${n === 1 ? '' : 's'}`,
        events: (n: number) => `${n} événement${n === 1 ? '' : 's'}`,
      },
      note:
        'Un plafond atteint une fois, pas un empan estimé : une vraie procédure d’empan s’arrête à la longueur ratée deux fois de suite, et l’échelle d’entraînement ne suit pas cette procédure. Lisez-les comme « tenu au moins une fois ».',
    },
    gv: {
      heading: 'Tourner les choses en tête',
      lede:
        'Issu des items de rotation de blocs réussis. Les niveaux composent un, deux ou trois quarts de tour ; le temps à un tour sert de base et la pente est la vitesse de rotation mentale — ce que chaque quart de tour supplémentaire coûte, le résultat de Shepard et Metzler lu sur vos propres niveaux. Les niveaux élevés ajoutent aussi des cubes, la pente en porte donc une part.',
      oneTurn: (n: number) => `Un quart de tour (${n} item${n === 1 ? '' : 's'})`,
      slope: (n: number) => `Coût par quart de tour supplémentaire (${n} nombre${n === 1 ? '' : 's'} de tours)`,
      perTurn: (ms: number) => `${ms > 0 ? '+' : ''}${ms} ms`,
      notYet: 'pas encore',
      note: 'Cinq items réussis à un nombre de tours avant d’afficher son temps, deux nombres de ce genre avant une pente. Seules les bonnes réponses sont chronométrées.',
    },
    glr: {
      heading: 'Apprendre et oublier',
      lede:
        'Issu des séries de paires associées jouées jusqu’à leur seconde moitié. Le premier chiffre est la question posée quelques secondes après l’apprentissage de chaque ensemble ; le second, la question posée quelques minutes plus tard, après tous les autres ensembles, sur une boîte que la première n’avait pas demandée. L’écart entre les deux est l’oubli — ce qui était récupérable tout de suite et ne l’était plus ensuite. Aucune des deux moitiés ne dit grand-chose seule ; la différence est la part qui relève du stockage plutôt que de l’apprentissage.',
      immediate: (n: number) => `Rappel immédiat (${n} question${n === 1 ? '' : 's'})`,
      delayed: (n: number) => `Rappel différé (${n} question${n === 1 ? '' : 's'})`,
      forgetting: 'Oubli',
      points: (pts: number) => `${pts > 0 ? '−' : pts < 0 ? '+' : ''}${Math.abs(pts)} pts`,
      note:
        'Quatre questions de chaque sorte avant d’afficher quoi que ce soit. Une question différée n’existe que dans un entraînement au format des paires associées ; un test interroge chaque ensemble une seule fois.',
    },
    sprintHeading: 'Contre-la-montre',
    sprintLede:
      'Les blocs chronométrés restent à l’écart de tout ce qui précède, car ils mesurent autre chose : le débit dans une fenêtre fixe, à un niveau figé pour tout le bloc. Aucun des chiffres de précision ou de vitesse du reste de cette page ne contient de réponse chronométrée.',
    sprintRuns: (n: number) => `${n} série${n === 1 ? '' : 's'}`,
    sprintBest: 'Meilleure',
    sprintLatest: 'Dernière',
    sprintScore: (correct: number, seconds: number) => `${correct} en ${seconds} s`,
    sprintAccuracy: (percent: string) => `${percent} des items tentés`,
    loading: 'Chargement…',
    overall: 'Vue d’ensemble',
    itemsAnswered: 'Items répondus',
    accuracy: 'Précision',
    medianTime: 'Temps médian',
    sessions: 'Sessions',
    dayStreak: 'Jours d’affilée',
    byDomain: 'Par domaine cognitif',
    domainChartLabel: 'Précision par domaine cognitif',
    domainLede:
      'Votre précision sur les sept aptitudes larges du modèle Cattell–Horn–Carroll que ces formats sollicitent. Un profil, pas un score : aucun étalonnage ne sous-tend ces barres, elles vous comparent à vous-même et à personne d’autre. Quand un domaine ne repose que sur un ou deux formats, la barre est le score de ces formats sous une étiquette de domaine.',
    provisional: (attempts: number) =>
      `${attempts} item${attempts === 1 ? '' : 's'} — bien trop peu pour en tirer quoi que ce soit`,
    provisionalKey: 'Les barres estompées reposent sur moins de dix items.',

    emptyHeading: 'Rien ici pour l’instant — et c’est normal',
    emptyBody:
      'Cette page est la seule à contenir vos propres données : elle démarre donc vide. Terminez une série et elle se remplira de votre précision, de votre vitesse, des formats qui vous résistent et des erreurs précises que vous répétez.',
    emptyCtaPractice: 'S’entraîner sur un format',
    emptyCtaTest: 'Passer le test complet',
    emptyPrivacy:
      'Tout reste dans ce navigateur. Il n’y a ni compte ni serveur où l’envoyer.',

    speed: {
      heading: 'Précision et vitesse',
      lede: 'Un point par format, placé selon votre précision et le temps que vous y passez. Les formats en haut à gauche sont ceux que vous avez intégrés ; en bas à droite, ceux que vous êtes encore en train de démêler.',
      label: 'Précision en fonction du temps de réponse médian, un point par format d’item',
      axisX: 'Temps médian par bonne réponse',
      axisY: 'Précision',
      point: (name: string, accuracy: string, time: string, attempts: number) =>
        `${name} : ${accuracy} de précision sur ${attempts} item${attempts === 1 ? '' : 's'}, ${time} de médiane`,
      needMore:
        'Répondez à au moins cinq items dans deux formats ou plus et l’arbitrage entre vitesse et précision apparaîtra ici.',
      fastest: 'le plus rapide',
      mostAccurate: 'le plus précis',
    },

    mistakes: {
      heading: 'Les erreurs que vous répétez',
      lede: 'Chaque mauvaise réponse correspond à une lecture erronée précise, nommée au moment où vous l’avez faite. Sur l’ensemble de votre historique, une ou deux dominent en général — et ce sont celles qui comptent, car il s’agit d’habitudes et non de lacunes.',
      label: 'Fréquence de chaque type d’erreur',
      empty:
        'Aucune erreur diagnostiquée pour l’instant. Chaque mauvaise réponse est étiquetée avec la lecture erronée qui la sous-tend, et elles s’accumulent ici.',
      bar: (tag: string, count: number, share: string) =>
        `${tag} : ${count} fois (${share} de vos erreurs diagnostiquées)`,
      colShare: 'Part',
    },

    wall: {
      heading: 'Chaque format, dans le temps',
      lede: 'Une courbe par format, les tentatives les plus anciennes à gauche. De petits graphiques côte à côte plutôt que quarante courbes sur un même axe : quarante couleurs sur un seul tracé seraient illisibles, et ceux-ci se parcourent du regard, ils ne se lisent pas au chiffre près.',
      never: 'pas encore tenté',
    },
    byItemType: 'Par type d’item',
    colType: 'Type',
    colDomain: 'Domaine',
    colAnswered: 'Répondus',
    colAccuracy: 'Précision',
    colMedianTime: 'Temps médian',
    colBestRun: 'Meilleure série',
    colPeakLevel: 'Niveau max',
    settings: 'Réglages',
    settingFeedback: 'Expliquer chaque réponse au fil de l’eau',
    settingFeedbackHint: 'Désactivez pour une série continue, façon examen.',
    settingAdaptive: 'Adapter la difficulté à mes performances',
    settingAdaptiveHint:
      'Trois bonnes réponses d’affilée font monter d’un niveau ; deux erreurs font redescendre.',
    settingMotion: 'Ralentir la présentation de l’empan',
    settingMotionHint: 'Les éléments de l’empan mnésique restent affichés plus longtemps.',
    settingLength: 'Items par série d’entraînement',
    yourData: 'Vos données',
    storageNote: (sessions: number) =>
      `Tout est stocké dans le localStorage de ce navigateur. Rien n’est envoyé nulle part — il n’y a aucun serveur à qui l’envoyer. ${sessions} session${sessions === 1 ? '' : 's'} enregistrée${sessions === 1 ? '' : 's'}.`,
    exportJson: 'Exporter en JSON',
    importJson: 'Importer un JSON',
    reset: 'Effacer l’historique',
    resetConfirm: 'Oui, tout supprimer',
    resetCancel: 'Annuler',
    historyCleared: 'Historique effacé.',
    charts: {
      heading: 'Progression dans le temps',
      lede: 'Vos chiffres, session après session. Une courbe qui monte signifie que vous progressez sur ces formats — pas que quelque chose de sous-jacent a changé.',
      accuracyTitle: 'Précision par session',
      accuracyLabel: 'Précision par session, la plus ancienne à gauche',
      speedTitle: 'Temps médian par bonne réponse',
      speedLabel: 'Temps de réponse médian par session, le plus ancien à gauche',
      activityTitle: 'Activité',
      activityLabel: 'Items répondus par jour sur les huit dernières semaines',
      rollingAverage: 'Moyenne glissante sur 3 sessions',
      needMore: 'Terminez encore quelques sessions et une tendance apparaîtra ici.',
      noActivity: 'Aucune activité sur les huit dernières semaines.',
      session: (n: number) => `Session ${n}`,
      describeDay: (items: number, correct: number) =>
        `${items} item${items === 1 ? '' : 's'}, ${correct} correct${correct === 1 ? '' : 's'}`,
      today: 'aujourd’hui',
      weeksAgo: (n: number) => `il y a ${n} semaines`,
      colTrend: 'Tendance',
      trendLabel: (type: string) => `Évolution de la précision pour « ${type} »`,
      improvedBy: (points: number) =>
        `Votre précision a gagné ${points} point${points === 1 ? '' : 's'} par rapport à la première moitié de votre historique.`,
      declinedBy: (points: number) =>
        `Votre précision a perdu ${points} point${points === 1 ? '' : 's'} par rapport à la première moitié de votre historique. La difficulté monte à mesure que vous progressez : c’est autant attendu que décourageant.`,
      steady: 'Votre précision reste stable par rapport à la première moitié de votre historique.',
    },
  },

  storeMessages: {
    notJson: 'Ce fichier n’est pas du JSON valide.',
    missingSchema: 'Version de schéma absente — ce fichier ne provient pas de cette application.',
    schemaMismatch: (theirs: number, ours: number) =>
      `Cet export utilise le schéma v${theirs} ; cette version lit le v${ours}.`,
    noSessions: 'Aucune session exploitable dans ce fichier.',
    imported: (n: number) => `${n} session${n === 1 ? '' : 's'} importée${n === 1 ? '' : 's'}.`,
    importedPartial: (added: number, already: number) =>
      `${added} nouvelle${added === 1 ? '' : 's'} session${added === 1 ? '' : 's'} importée${added === 1 ? '' : 's'} ; ${already} étaient déjà présentes.`,
  },

  items: {
    matrix: {
      name: 'Raisonnement matriciel',
      blurb: 'Trouvez la figure qui complète le motif 3×3.',
      description:
        'Une grille 3×3 de figures dont la case en bas à droite manque. Chaque attribut — forme, taille, remplissage, nombre et disposition — suit une règle le long des lignes. Déduisez les règles et choisissez la figure qui les complète. C’est le test non verbal de référence du raisonnement fluide, et le format le plus étroitement associé au facteur g.',
      seenIn: 'Matrices progressives de Raven, Matrices de la WAIS, Cattell CFIT, NNAT',
    },
    'series-number': {
      name: 'Suites numériques',
      blurb: 'Trouvez la règle et prolongez la suite.',
      description:
        'Une suite d’entiers construite sur une règle cachée : un écart constant, un écart croissant, deux suites entrelacées, des blocs répétés, ou un multiplicateur qui change lui-même. La difficulté suit les cinq opérateurs cognitifs ANSIG, qui expliquent à eux seuls environ 77 % de la variance de difficulté dans la littérature sur la génération automatique d’items.',
      seenIn: 'Cattell CFIT, Wonderlic, CogAT quantitatif, la plupart des batteries d’aptitude',
    },
    'series-letter': {
      name: 'Suites de lettres',
      blurb: 'Prolongez le motif à travers l’alphabet.',
      description:
        'Une suite de lettres qui avance dans l’alphabet selon une règle cachée : un pas fixe, deux pas alternés, ou un pas qui grandit. C’est la même tâche de raisonnement inductif que les suites numériques, mais sur un ensemble ordonné familier plutôt que sur du calcul, si bien que l’aisance arithmétique interfère moins avec le raisonnement mesuré.',
      seenIn: 'CogAT, Wonderlic, concours d’entrée et batteries d’aptitude de la fonction publique',
    },
    'odd-one-out': {
      name: 'L’intrus',
      blurb: 'Quatre figures partagent une propriété. Une seule y échappe.',
      description:
        'Toutes les figures sauf une partagent une propriété définitoire — même forme, même remplissage, même taille ou même nombre d’éléments — tout en variant librement par ailleurs. Trouvez celle qui rompt la règle. Chaque item est vérifié pour qu’une seule figure soit défendablement l’intrus, sur une seule dimension.',
      seenIn: 'Classification du Cattell CFIT, Figure Classification du CogAT, NNAT',
    },
    'analogy-figural': {
      name: 'Analogie figurative',
      blurb: 'A est à B ce que C est à… quelle figure ?',
      description:
        'Déterminez comment la première figure a été transformée en la deuxième — changement de taille, de remplissage, d’orientation ou de forme — puis appliquez exactement la même transformation à la troisième. La mise en correspondance analogique est l’une des mesures les plus pures du raisonnement inductif : elle isole le transfert d’une règle plutôt que sa découverte.',
      seenIn: 'Matrices de la WAIS (items analogiques), Figure Analogies du CogAT, Raven',
    },
    syllogism: {
      name: 'Syllogismes',
      blurb: 'Distinguez ce qui suit de ce qui semble suivre.',
      description:
        'Deux prémisses portant sur trois catégories. Choisissez la conclusion nécessairement vraie, ou indiquez qu’aucune ne l’est. Les noms de catégories sont inventés à dessein : avec des catégories réelles, la plausibilité se substitue à la déduction. La validité est ici décidée par vérification exhaustive de tous les modèles : la clé est démontrée, pas supposée.',
      seenIn: 'Épreuves de raisonnement critique du GMAT, du LSAT, de l’UCAT et du Watson–Glaser',
    },
    rotation: {
      name: 'Rotation mentale',
      blurb: 'Repérez la même forme, tournée — et non retournée.',
      description:
        'L’une des réponses est la forme cible ayant subi une rotation ; les autres sont des images miroir ou de quasi-copies. La distinction entre rotation et réflexion est le cœur de la tâche : chaque forme est donc vérifiée comme chirale, car une forme identique à son propre miroir rendrait l’item insoluble.',
      seenIn: 'Test de rotations mentales de Vandenberg & Kuse, Shepard & Metzler (1971), DAT spatial',
    },
    'paper-folding': {
      name: 'Pliage de papier',
      blurb: 'Plier, perforer, déplier — où sont les trous ?',
      description:
        'Une feuille carrée est pliée une ou deux fois, puis perforée à travers toutes les épaisseurs. Déterminez où se trouvent les trous une fois la feuille rouverte. Il s’agit de visualisation spatiale plutôt que de rotation : il faut maintenir une image mentale et la transformer sur plusieurs étapes.',
      seenIn: 'Paper Folding Test de l’ETS (VZ-2), DAT Space Relations, nombreux concours',
    },
    span: {
      name: 'Empan mnésique',
      blurb: 'Retenez une séquence — puis restituez-la.',
      description:
        'Une séquence apparaît élément par élément, puis vous la saisissez. L’empan endroit mesure le simple stockage ; l’empan envers exige de retenir la séquence et de l’inverser en même temps, ce qui en fait une tâche de mémoire de travail et non de simple rétention. Les séquences s’allongent avec la difficulté.',
      seenIn: 'Mémoire des chiffres de la WAIS et de la WISC, Stanford–Binet',
    },
    'symbol-search': {
      name: 'Recherche de symboles',
      blurb: 'L’un des symboles figure-t-il dans le groupe ? Vite.',
      description:
        'Deux symboles cibles, puis un groupe à parcourir. Indiquez si l’un des deux y figure. Chaque item est facile isolément — ce qui est mesuré, c’est la vitesse à laquelle vous en enchaînez beaucoup sans faute. La précision restant proche du plafond, ce type est évalué sur le temps de réponse médian plutôt que sur le pourcentage de réussite.',
      seenIn: 'Symboles de la WAIS et de la WISC, Code de la WAIS (même indice)',
    },
    'figure-weights': {
      name: 'Balances',
      blurb: 'Les balances s’équilibrent. Quel groupe équilibre la dernière ?',
      description:
        'Une série de balances, chacune montrant ce qui équilibre quoi. Ces prémisses donnent à chaque forme un poids relatif aux autres ; il manque un plateau à la dernière balance, et vous choisissez le groupe qui l’équilibre. Les formes étant des valeurs et les balances des équations, il s’agit de raisonnement quantitatif sans aucune notation arithmétique — et le problème est décidable, si bien qu’une seule réponse peut équilibrer. L’erreur la plus fréquente consiste à égaler le nombre d’objets au lieu de leur poids.',
      seenIn: 'Balances de la WAIS-IV et de la WISC-V, Cattell CFIT (Conditions), épreuves de raisonnement quantitatif en général',
    },
    'n-back': {
      name: 'Tâche N-back',
      blurb: 'Comptez les lettres qui se répètent N rangs plus tôt.',
      description:
        'Un flux de lettres défile, une à la fois. Comptez celles qui reprennent la lettre apparue un nombre fixe de rangs plus tôt — un rang d’abord, jusqu’à trois. La mémoire des chiffres demande de retenir une liste immobile ; cette épreuve demande de tenir une fenêtre glissante des derniers éléments et de la réécrire à chaque pas, d’où une mesure de la mise à jour plutôt que du stockage. Le flux a disparu au moment de répondre, et il ne se rejoue pas.',
      seenIn: 'Recherche sur l’entraînement cognitif et la mémoire de travail (Jaeggi et al.), Cogmed, littérature sur le double n-back',
    },
    'trail-making': {
      name: 'Pistes à relier',
      blurb: 'Reliez les cibles dans l’ordre. Contre le chronomètre.',
      description:
        'Des cibles sont dispersées sur le plateau et vous les reliez dans l’ordre, le plus vite possible. La moitié des plateaux ne comportent que des nombres ; les autres alternent nombres et lettres — 1, A, 2, B — ce qui ajoute le travail de tenir deux suites et de passer de l’une à l’autre sans perdre le fil. La forme n’est délibérément pas un niveau de difficulté : les niveaux ne diffèrent que par le nombre de cibles, si bien que les deux formes restent appariées sur la recherche visuelle et la motricité, et que l’écart entre vos temps mesure le basculement seul. Évalué sur le temps de parcours ; cliquer une mauvaise cible pénalise la série sans l’interrompre.',
      seenIn: 'Trail Making Test A et B (Army Individual Test Battery, 1944), batterie de Halstead–Reitan, trail making de Delis–Kaplan',
    },
    'block-span': {
      name: 'Empan spatial',
      blurb: 'Regardez les blocs s’allumer. Retapez-les dans l’ordre.',
      description:
        'Neuf blocs occupent la même disposition éparpillée à chaque item. Certains s’allument l’un après l’autre, et vous les retouchez dans l’ordre où ils se sont allumés. C’est l’empan de chiffres avec des lieux à la place des chiffres — la même exigence de retenir une liste et de la restituer, faite de positions que l’on ne peut pas se répéter à voix basse, ce qui explique que les deux se dissocient et que les deux figurent ici. Le plateau ne bouge jamais d’un item à l’autre, délibérément : une nouvelle disposition à chaque fois vous obligerait à chercher les blocs avant de pouvoir en retenir l’ordre, et cette recherche se mêlerait à l’empan. Les niveaux ne diffèrent que par la longueur de la séquence — ni la vitesse des flashs, ni le nombre de blocs, et jamais un essai à rebours, car restituer une séquence à l’envers est une tâche plus difficile et non une tâche plus longue.',
      seenIn: 'Tâche des blocs de Corsi (Corsi, 1972), Empan spatial des échelles de Wechsler (WMS), littérature sur le calepin visuospatial',
    },
    interference: {
      name: 'Comptez, ne lisez pas',
      blurb: 'Combien de chiffres ? Et non lequel.',
      description:
        'Plusieurs exemplaires d’un même chiffre s’affichent : annoncez combien il y en a, et non ce qu’ils disent. Devant trois 4, « 4 » est la réponse que l’œil propose et 3 celle qu’on vous demande — et c’est le coût de retenir la première qui est mesuré ici. C’est une tâche de Stroop portant sur des chiffres plutôt que sur des couleurs : la teinte ne véhicule aucune information sur ce site, et une version colorée ferait de la vision des couleurs une condition d’accès au format plutôt qu’un détail d’accessibilité. Les chiffres gardent en outre l’item identique dans toutes les langues, ce qu’une version verbale ne pourrait pas.',
      seenIn: 'Stroop (1935) et sa variante de comptage, batteries de fonctions exécutives et d’inhibition, test d’interférence couleur-mot de Delis–Kaplan',
    },
    arithmetic: {
      name: 'Calcul mental',
      blurb: 'Trouvez le résultat. Vite.',
      description:
        'Une courte expression à évaluer — additions et soustractions d’abord, puis multiplications et divisions exactes, enfin deux opérateurs enchaînés. Les divisions tombent toujours juste et les soustractions ne passent jamais sous zéro : la gestion des signes et les fractions sont des compétences distinctes, qui méritent un traitement à part plutôt que de surgir sans prévenir dans une épreuve de vitesse. On choisit la réponse au lieu de la saisir, pour que la vitesse de frappe reste hors d’une mesure qui porte sur le calcul. L’une des réponses fausses se termine toujours par le même chiffre que la bonne : sans cela, on pourrait répondre en ne calculant que le chiffre des unités.',
      seenIn: 'Arithmétique de la WAIS et de la WISC, sections quantitatives des batteries d’aptitude, logiciels d’entraînement au calcul',
    },
    'head-count': {
      name: 'Compte des présents',
      blurb: 'Des personnages entrent et sortent. Combien en reste-t-il ?',
      description:
        'Des groupes de personnages entrent et sortent d’une salle, un mouvement à la fois. Tenez le compte courant et annoncez ce qu’il en reste à la fin. La mémoire des chiffres retient une liste immobile, la tâche N-back tient une fenêtre glissante ; ici il faut tenir un seul nombre et le réécrire à chaque pas en oubliant le précédent — voilà pourquoi les sorties font tout l’intérêt. Ne compter que les entrées donne un total toujours disponible et toujours faux. Les mouvements ont disparu au moment de répondre, et rien ne se rejoue.',
      seenIn: 'Tâches de mise à jour en mémoire de travail (keep-track, comptage courant), logiciels commerciaux d’entraînement cérébral',
    },
    coding: {
      name: 'Code chiffre–symbole',
      blurb: 'Lisez la légende. Quel symbole va avec le chiffre ?',
      description:
        'Une légende associe à chaque chiffre un symbole abstrait. Un chiffre est désigné : trouvez son symbole dans la légende. Toutes les réponses proposées figurent dans la légende, si bien qu’on ne peut pas trouver la bonne par élimination — il faut vraiment lire l’association. Dans la batterie d’origine, il s’agit d’une épreuve écrite de deux minutes évaluée au nombre de substitutions accomplies ; ce qui est mesuré ici est donc la vitesse d’une substitution, et non l’endurance.',
      seenIn: 'Code de la WAIS et de la WISC, Symboles-chiffres de Wechsler, Symbol Digit Modalities Test',
    },
    'high-number': {
      name: 'Lequel vaut le plus',
      blurb: 'Deux nombres, dessinés à des tailles trompeuses.',
      description:
        'Deux nombres apparaissent côte à côte, dessinés à des tailles sans rapport avec leur valeur, et vous désignez celui qui vaut le plus. La valeur d’un chiffre se lit qu’on l’ait demandé ou non : un 8 minuscule à côté d’un 3 énorme fait donc arriver deux réponses à la fois, dont une seule répond à la question. C’est l’effet de congruence de taille, cousin numérique du Stroop, et il se mesure de la même façon : votre précision doit rester haute, et le résultat est l’écart entre vos temps selon que les deux lectures s’accordent ou non. Les deux nombres ont toujours le même nombre de chiffres, pour que le dessin reste le seul canal de taille en jeu.',
      seenIn: 'Congruence de taille (Henik et Tzelgov, 1982), batteries de cognition numérique, test High Number de Brain Age 2',
    },
    'hand-game': {
      name: 'Pierre, feuille, ciseaux',
      blurb: 'Jouez le coup gagnant — ou le coup perdant.',
      description:
        'Une main est montrée et vous jouez celle qui la bat, ou celle qui perd contre elle, selon ce que l’item demande. La battre est une réponse que vous avez déjà : le jeu est surappris et le coup gagnant arrive sans être calculé. Devoir perdre exécute la même recherche contre cette habitude, et c’est bien l’objet de l’épreuve — mesurer ce que coûte de retenir une réponse qu’on n’a pas eu à réfléchir. Les niveaux élevés demandent de perdre plus souvent. Six items existent en tout, et c’est délibéré : une tâche de conflit exige un petit ensemble répété, puisqu’il faut que l’habitude soit là pour qu’on puisse y résister.',
      seenIn: 'Test de Brain Age 2, paradigmes go/no-go et d’inhibition de la réponse',
    },
    'serial-subtraction': {
      name: 'Décompte',
      blurb: 'Retranchez le même nombre, encore et encore.',
      description:
        'Partez d’un nombre et retranchez-en plusieurs fois le même — les fameux « sept en sept ». Aucune étape n’est difficile : la difficulté est la chaîne, puisque chaque résultat devient le problème suivant et qu’il n’y a nulle part où noter quoi que ce soit. Perdre le fil une fois fait perdre l’item. Le pas n’est jamais 5 ni 10, les deux qui permettent de descendre une colonne au lieu de calculer, et chaque chaîne franchit au moins une dizaine pour que la retenue ait vraiment lieu. Les niveaux diffèrent par la longueur de la chaîne, pas par la difficulté d’un pas.',
      seenIn: 'Examen de l’état mental (sept en sept), dépistages de l’attention et de la confusion, Brain Age 2',
    },
    'math-recall': {
      name: 'Additionnez ce que vous avez vu',
      blurb: 'Des nombres défilent. Additionnez-les une fois disparus.',
      description:
        'De deux à quatre nombres apparaissent un à un, chacun remplacé par le suivant, et vous donnez leur somme après le dernier. Rien n’est jamais à l’écran pour être additionné — le premier nombre doit survivre à l’arrivée du deuxième — donc l’épreuve retient du matériel et le manipule en même temps, ce qui distingue la mémoire de travail du simple rappel. Additionner au fil de l’eau est une voie légitime et charge la même chose ; la voie qui n’existe pas est celle qui consisterait à regarder la somme entière. Il n’y a pas de rediffusion.',
      seenIn: 'Math Recall de Brain Age 2, empans complexes et empan opératoire, Arithmétique de la WAIS',
    },
    'time-lapse': {
      name: 'Temps écoulé',
      blurb: 'Deux horloges. Combien de temps entre elles ?',
      description:
        'Deux cadrans à aiguilles, et le nombre de minutes qui les sépare. Le calcul se fait en base soixante, donc la retenue tombe sur une frontière que l’arithmétique ordinaire n’utilise jamais — c’est pourquoi ce qui rend un item difficile est le franchissement de l’heure, et non la taille de l’intervalle. Tous les écarts restent inférieurs à une heure pour que la réponse soit un nombre unique plutôt que deux, et les deux aiguilles se posent sur des repères imprimés pour qu’aucune partie de l’item ne consiste à lire un cadran à la minute près.',
      seenIn: 'Time Lapse de Brain Age, items de lecture de l’heure des batteries de numératie, Arithmétique de la WISC',
    },
    'clock-spin': {
      name: 'Horloge tournée',
      blurb: 'Lisez une horloge qui n’est pas droite.',
      description:
        'Un cadran est dessiné tourné, chiffres compris, et vous dites l’heure qu’il indique. Lire un cadran est entièrement lié à son orientation — midi en haut, trois à droite — si bien que tourner la face casse l’habitude et vous laisse la remettre d’aplomb mentalement. Les chiffres restent sur le cadran : sans eux la rotation serait indevinable et toutes les lectures se vaudraient. Certaines rotations sont des angles droits : elles amènent chaque repère d’heure sur un autre et laissent la face ressembler à une horloge parfaitement ordinaire — avec le 12 là où va le 3, et c’est tout le piège. Les autres laissent les repères visiblement décalés, si bien que la rotation s’annonce d’elle-même.',
      seenIn: 'Clock Spin de Brain Age 2, paradigmes de rotation mentale, épreuves de lecture et de dessin d’horloge',
    },
    'change-maker': {
      name: 'Rendre la monnaie',
      blurb: 'Quelles pièces font la monnaie ?',
      description:
        'Un prix, une somme donnée, et quatre poignées de pièces : choisissez celle qui fait la monnaie. La soustraction est la partie facile et n’est pas ce qui est mesuré ici ; l’intéressant est la décomposition — trouver le plus petit nombre de pièces qui fait une somme, c’est-à-dire l’algorithme glouton que tout le monde exécute à la caisse sans l’avoir jamais appris. Toutes les réponses proposées comptent le même nombre de pièces que la bonne : les compter n’apprend donc rien, et il faut faire les totaux. L’euro et la livre ont la même structure de coupures, si bien qu’une graine donne le même item dans les deux langues, aux symboles près.',
      seenIn: 'Change Maker de Brain Age 2, items de monnaie des batteries de numératie et de compétences de base',
    },
    'triangle-math': {
      name: 'Pyramide de nombres',
      blurb: 'Chaque case est la somme des deux du dessous.',
      description:
        'Une rangée de nombres est donnée et la pyramide au-dessus est vide ; chaque case est la somme des deux qui la portent, et vous les remplissez toutes. Les additions sont faciles et elles ne sont pas indépendantes : la deuxième rangée doit être finie avant que la troisième puisse commencer, et une case fausse remonte dans tout ce qui la surmonte. Cette dépendance est le format : le calcul mental mesure une étape, le décompte mesure une chaîne d’étapes identiques sur une seule valeur, et ceci mesure une chaîne qui se ramifie, avec deux résultats intermédiaires à tenir en même temps. Comme toutes les cases sont demandées, un item raté montre quelle addition a lâché, et pas seulement que le total est faux.',
      seenIn: 'Triangle Math de Brain Age, exercices de fluence arithmétique, batteries de calcul mental',
    },
    tower: {
      name: 'La tour',
      blurb: 'En combien de coups, au minimum, passe-t-on de cette disposition à celle-là ?',
      description:
        'Trois perles sur trois tiges de hauteurs différentes, montrées deux fois : telles qu’elles sont, et telles qu’elles devraient être. Une perle se déplace à la fois, seulement depuis le sommet d’une tige, seulement vers une tige où il reste de la place. Vous ne touchez à rien : vous trouvez de tête la plus courte suite de coups et vous dites sa longueur. C’est la Tour de Londres, le test classique de planification : les dispositions intéressantes sont celles où une perle doit être écartée de l’endroit où on la veut pour faire place à une autre, ce qu’un lecteur qui ne regarde qu’un coup à l’avance ne verra pas. La réponse est prouvée minimale par une recherche sur toutes les dispositions que le plateau permet, et chaque niveau demande des solutions de deux longueurs voisines, si bien que le niveau ne donne jamais la réponse.',
      seenIn: 'La Tour de Londres (Shallice, 1982), D-KEFS Tower, Stockings of Cambridge du CANTAB, Spatial Planning de Cambridge Brain Sciences',
    },
    'table-reasoning': {
      name: 'Lecture de tableau',
      blurb: 'Quatre lignes de chiffres, une question. La réponse est dans le tableau, pas dessus.',
      description:
        'Un petit tableau — quatre équipes, quelques trimestres — et une question à son sujet : un total en ligne ou en colonne, l’écart entre deux cases, l’équipe au plus gros total, une moyenne ou une variation en pourcentage. L’arithmétique est volontairement facile. Ce que le format mesure, c’est trouver les bonnes cases, savoir quelle opération la question demande, et retenir deux ou trois quantités assez longtemps pour les combiner. Tous les autres formats quantitatifs du site vous tendent les nombres déjà choisis ; ici, le choix est la tâche. Les mauvaises réponses sont les erreurs classiques, nommées — la ligne voisine lue par mégarde, les deux nombres additionnés au lieu d’être soustraits, un pourcentage pris sur la mauvaise base — et la ligne qui contient le plus grand nombre n’est jamais celle au plus grand total.',
      seenIn: 'Tests de raisonnement numérique SHL et Kenexa, tests numériques de la fonction publique, sous-test Numerical Ability du DAT',
    },
    'reaction-time': {
      name: 'Temps de réaction',
      blurb: 'Attendez le signal. Touchez la cible qui s’allume. Cinq fois.',
      description:
        'Une ou plusieurs cibles, une attente imprévisible, puis l’une d’elles s’allume : touchez-la. Avec une seule cible c’est le temps de réaction simple, la plus ancienne mesure de la psychologie ; avec plusieurs, c’est le temps de réaction de choix, et les millisecondes en plus sont le coût de la décision. C’est la seule chose que les niveaux changent — la loi de Hick dit que ce coût croît avec le nombre d’alternatives — si bien que l’échelle parcourt un seul construit, du simple réflexe au choix à six branches. L’attente avant le signal est tirée de la graine entre une et trois secondes, donc impossible à chronométrer, et une réponse avant le signal est un faux départ compté comme une erreur. Un item est un bloc de cinq essais, et le temps enregistré est la médiane du bloc, parce qu’un essai isolé n’est que du bruit : ici la latence est la mesure elle-même et non un sous-produit, et c’est le seul nombre de ce site qui ait un sens dans la vie courante.',
      seenIn: 'Donders (1868), Hick (1952), le test de réaction de Human Benchmark, CANTAB Reaction Time, tâche de Deary–Liewald',
    },
    'feature-match': {
      name: 'Comparaison de symboles',
      blurb: 'Deux panneaux de symboles. Sont-ils identiques ?',
      description:
        'Deux panneaux, chacun avec le même nombre de symboles abstraits aux mêmes positions. Soit chaque symbole correspond à celui d’en face, soit exactement un diffère — et quand il diffère, c’est par un seul trait : la forme, ou le remplissage, ou l’orientation, jamais plus. Dites si les panneaux sont identiques. C’est la tâche de vérification que les anciennes batteries d’aptitude appelaient comparaison de nombres ou de noms et que Cambridge Brain Sciences appelle Feature Match ; elle est classée sous la vitesse de traitement parce qu’il n’y a rien à calculer. La réponse est visible, et la mesure est la vitesse à laquelle on trouve une réponse visible en vérifiant paire après paire. Les panneaux gardent la même disposition pour que la recherche ne s’ajoute pas à la comparaison, et le niveau ne change que le nombre de paires à vérifier.',
      seenIn: 'Feature Match de Cambridge Brain Sciences, Minnesota Clerical Test, DAT Clerical Speed and Accuracy, Barrage de la WAIS (cousin)',
    },
    'cube-net': {
      name: 'Patron de cube',
      blurb: 'Six carrés marqués à plat. Quel cube en résulte ?',
      description:
        'Un patron de six carrés, chacun portant une marque, et plusieurs cubes vus par un coin. Un seul de ces cubes peut être plié à partir du patron. Les autres montrent soit deux faces qui seraient opposées sur le cube fini, soit les trois bonnes faces disposées à l’envers — une image miroir qu’aucun pliage ne peut produire. C’est l’autre moitié du pliage de papier : la feuille qui se referme au lieu de s’ouvrir, et l’item que les batteries d’aptitude spatiale proposent depuis les Differential Aptitude Tests. Les marques sont toutes symétriques, si bien que l’orientation de chaque face n’a pas d’importance ; tout repose sur le sens du coin.',
      seenIn: 'DAT Space Relations, ASVAB Assembling Objects (cousin), nombre de concours d’entrée et d’apprentissage',
    },
    'cube-net-oriented': {
      name: 'Patron de cube orienté',
      blurb: 'Six carrés dont les marques ont un haut. Quel cube en résulte ?',
      description:
        'Le patron de cube avec la contrainte que le format simple laisse de côté. Chaque carré porte une marque qui a un haut — une flèche, un L, un demi-disque — si bien que l’orientation de chaque face fait partie de la réponse, et qu’un cube montrant les trois bonnes faces, dans le bon sens, avec une marque tournée d’un quart de tour est faux. C’est l’item des Differential Aptitude Tests tel qu’il est réellement posé : suivre non seulement quels carrés du patron se rejoignent, mais quelles arêtes. Six options en trois paires : la réponse et la réponse avec une marque tournée, un coin en miroir et son jumeau tourné, et un coin montrant deux faces opposées, deux fois. Au dernier niveau, les marques des miroirs sont tournées exactement comme le seraient celles du vrai cube, et seul le sens du coin les trahit.',
      seenIn: 'DAT Space Relations (avec faces à motifs), batteries spatiales de type Bennett, nombre de concours d’apprentissage et d’écoles d’ingénieurs',
    },
    'block-rotation': {
      name: 'Rotation de blocs',
      blurb: 'Une forme en blocs. Laquelle est la même forme, tournée ?',
      description:
        'Un objet fait de cubes, dessiné en trois dimensions, et quatre autres objets. L’un est le même objet tourné dans l’espace ; l’un est son image miroir ; deux ont un seul bloc déplacé. Trouvez celui qui est seulement tourné. C’est l’expérience de Shepard et Metzler de 1971, celle qui a donné son nom à la rotation mentale et montré que le temps de réponse croît avec l’angle de la rotation — l’objet est donc réellement tourné en pensée. Le format de rotation à plat de ce site est le même construit sur papier ; dans l’espace, l’image miroir ne se reconnaît pas en retournant la feuille, il faut la trouver fausse en tournant l’objet jusqu’à ce qu’il coïncide ou non. Chaque objet est dessiné dans une orientation qui montre tous ses blocs : ce qu’on peut compter est ce qui est là. Les niveaux ajoutent des blocs et des rotations.',
      seenIn: 'Shepard & Metzler (1971), Mental Rotations Test de Vandenberg & Kuse, Purdue Spatial Visualization Test',
    },
    'gear-train': {
      name: 'Train d’engrenages',
      blurb: 'Des roues reliées par des dents et des courroies. La première tourne comme indiqué ; et la dernière ?',
      description:
        'Une rangée de roues, chacune reliée à la suivante par des dents qui s’engrènent ou par une courroie, ouverte ou croisée. Une flèche indique le sens de la première roue. Dites dans quel sens tourne la dernière, et à quelle vitesse pour chaque tour de la première. Deux règles décident : le sens s’inverse à chaque engrènement et à chaque courroie croisée, et la vitesse se multiplie à chaque liaison par le rapport de la taille de la roue menante à celle de la roue menée. C’est le seul coin du raisonnement mécanique qui puisse être généré plutôt que dessiné à la main, et celui que les tests Bennett et DAT proposent toujours. Les distracteurs sont les trois façons de se tromper — sens mal compté, rapport inversé, ou les deux — si bien qu’une erreur est nommée.',
      seenIn: 'Test de compréhension mécanique de Bennett, DAT Raisonnement mécanique, ASVAB (compréhension mécanique)',
    },
    'logic-grid': {
      name: 'Grille logique',
      blurb: 'Des formes dans une rangée de places, quelques indices. Qu’y a-t-il à la place marquée ?',
      description:
        'Une rangée de places numérotées, autant de formes que de places, et une poignée d’indices : celle-ci est quelque part à gauche de celle-là, celle-ci n’est pas à la place 2, ces deux-là sont côte à côte. Une place porte un point d’interrogation, et la réponse est la forme qui doit s’y trouver. C’est le problème de contraintes derrière tous les casse-tête « zèbre » ou grilles logiques, débarrassé des maisons et des nationalités — c’est du vocabulaire, et le vocabulaire est ce que ce site ne génère pas. Tous les arrangements sont vérifiés contre les indices, donc la place marquée n’a qu’un occupant possible ; chaque indice est nécessaire, parce que l’ensemble est élagué jusqu’à ce qu’en retirer un laisse deux formes possibles ; et aucun indice ne dit jamais directement ce que contient la place marquée. Le niveau retire d’abord les indices faciles — les placements, puis les éliminations — et ajoute ensuite une cinquième forme : la part qu’il faut déduire plutôt que lire. Quatre réponses sont proposées à chaque niveau.',
      seenIn: 'Casse-tête du zèbre / d’Einstein, inférence relationnelle de Wason & Johnson-Laird, raisonnement analytique du LSAT (en forme verbale)',
    },
    'chimp-test': {
      name: 'Test du chimpanzé',
      blurb: 'Des nombres éparpillés sur une grille. Touchez le 1, le reste s’efface : touchez-les dans l’ordre.',
      description:
        'Plusieurs chiffres sont éparpillés sur une grille. Regardez aussi longtemps que vous voulez. Touchez le 1, et tous les chiffres sont masqués ; touchez alors l’emplacement du 2, puis du 3, et ainsi de suite. La tâche vient de l’étude d’Inoue et Matsuzawa (2007), où le chimpanzé Ayumu s’en acquittait avec plus de chiffres et plus vite que les adultes humains testés en face de lui — Human Benchmark l’a rendue célèbre. Ce qu’il faut retenir n’est pas les nombres, toujours de un à N, mais où chacun se trouvait : une disposition entière encodée d’un coup avec un ordre imprimé dessus, la combinaison que les autres empans spatiaux du site ne couvrent pas. L’empan de blocs montre les places une à une, le rappel de motif montre un ensemble sans ordre. Le niveau ne change que le nombre de chiffres ; la grille garde la même taille, et une disposition dont les chiffres suivraient le sens de lecture est retirée, parce que ce serait une règle à retenir plutôt qu’un ensemble de places.',
      seenIn: 'Inoue & Matsuzawa (2007), Chimp Test de Human Benchmark, Memory Matrix de Lumosity (variante)',
    },
    'number-line': {
      name: 'Droite numérique',
      blurb: 'Une droite aux extrémités indiquées. Placez ce nombre dessus.',
      description:
        'Une droite va d’un nombre à un autre, et un troisième nombre est affiché. Mettez-le à sa place. Rien n’est calculé : la tâche fait appel au sens des grandeurs, à la place qu’occupe une quantité par rapport aux autres, et elle est notée d’après la distance entre la marque et la vraie place, en part de la droite entière. C’est l’épreuve d’estimation dont la littérature développementale se sert pour suivre la croissance du sens du nombre, et chez l’adulte elle sépare encore ceux qui voient 700 comme un lieu de ceux qui le voient comme un mot. Les niveaux changent la droite plus que la tolérance : de zéro à 100 environ, puis à 1000, puis une droite qui ne part pas de zéro, puis une fraction ou un décimal sur une droite unité, puis une droite qui traverse zéro de façon inégale.',
      seenIn: 'Estimation sur droite numérique de Siegler & Opfer, Panamath (cousin), items de sens du nombre du TEMA et de KeyMath',
    },
    'go-no-go': {
      name: 'Go ou stop',
      blurb: 'Appuyez sur le signal plein. Retenez-vous sur le barré.',
      description:
        'Une cible, huit signaux à la suite. Six sont pleins : appuyez. Deux sont barrés : n’appuyez pas. Donders a posé cette tâche à côté de la réaction simple et de la réaction de choix en 1868 — sa réaction c, plusieurs signaux mais une réponse à un seul type — et elle isole le coût de décider s’il faut répondre du coût de décider quoi. Un siècle et demi plus tard, c’est la mesure standard de l’inhibition de réponse : après une suite d’appuis, le suivant est à moitié lancé avant que le signal soit lu, et le signal barré doit l’arrêter. Un signal barré n’est jamais le premier et n’en suit jamais un autre, pour que chacun ait une habitude à interrompre. Le niveau ne change qu’une chose, la durée d’affichage du signal : une fenêtre plus courte force des appuis plus rapides, et un appui plus rapide est plus dur à retenir. Appuyer sur un signal barré et laisser passer un signal plein sont comptés comme deux erreurs différentes, parce qu’elles le sont.',
      seenIn: 'Donders (1868), la tâche go/no-go, la Sustained Attention to Response Task (Robertson et al., 1997), CANTAB Stop Signal, Lumosity Train of Thought',
    },
    'pattern-recall': {
      name: 'Rappel de motif',
      blurb: 'Une grille s’allume d’un coup. Retrouvez les cases allumées.',
      description:
        'Seize cases en carré ; plusieurs s’allument ensemble un instant puis s’éteignent ; vous touchez celles qui étaient allumées. L’empan de blocs montre des positions l’une après l’autre et demande leur ordre — ici, tout est montré d’un coup et c’est l’ensemble qui est demandé, et les deux se dissocient : l’un est une suite à répéter, l’autre une image à retenir. La grille ne change jamais de taille et le motif reste affiché le même instant à tous les niveaux, si bien que seul le nombre de cases à retenir augmente. Les motifs qui se nomment en un mot — une ligne entière, un bloc plein — ne sont jamais montrés, parce qu’un nom est une seule chose à retenir alors que l’item est censé en compter plusieurs.',
      seenIn: 'Le Visual Patterns Test (Della Sala et al., 1997), Visual Memory de Human Benchmark, Flash Memory de Big Brain Academy',
    },
    'paired-associates': {
      name: 'Paires associées',
      blurb: 'Des boîtes s’ouvrent une à une sur un symbole. Laquelle contenait celui-ci ?',
      description:
        'Une rangée de boîtes fermées. Elles s’ouvrent une à la fois, chacune sur un symbole, puis se referment ; ensuite un symbole est montré seul et vous touchez la boîte qui le contenait. C’est l’apprentissage associatif — lier deux choses qui n’avaient aucune raison d’aller ensemble, ce à quoi revient retenir un nom sur un visage ou un mot et sa traduction — et c’est le premier format du site classé sous le stockage et la récupération à long terme. Il peut être généré là où le vocabulaire ne le peut pas parce que les paires sont arbitraires par construction : les symboles sont abstraits, les boîtes sont des boîtes, et rien d’autre que l’apprentissage n’aide. La question est un symbole et la réponse un emplacement : on retrouve un lieu à partir d’une chose, ce qui est le sens associatif. Entre la dernière boîte et la question, un intervalle rempli d’environ sept secondes — une grille allume des cases à toucher — bloque la répétition mentale, si bien que la réponse doit venir de ce qui a été stocké et non de ce qu’on se répétait encore. Une question des minutes plus tard dépasse un seul item ; une série d’entraînement de ce format en pose donc une : une fois tous les ensembles appris, chacun est redemandé, sur une autre boîte à chaque fois.',
      seenIn: 'CANTAB Paired Associates Learning, Paired Associates de Cambridge Brain Sciences, Paires de mots de la WMS (en forme verbale), Woodcock–Johnson Visual–Auditory Learning',
    },
    'pairs-delayed': {
      name: 'Rappel différé',
      blurb: 'Les paires apprises plus tôt dans la série, redemandées.',
      description:
        'Pas un format à choisir : une série d’entraînement en paires associées en ajoute un pour chaque ensemble appris, après toute la série. Les boîtes sont fermées, un symbole s’affiche, et vous touchez la boîte qui le contenait — une autre boîte que celle demandée sur le moment, si bien qu’une bonne réponse prouve que la paire a été stockée et non qu’une récupération a été répétée. C’est la question différée que l’item immédiat ne peut poser, et la mesure la plus complète du stockage et de la récupération à long terme.',
      seenIn: 'WMS Paires associées verbales II (différé), rappel à long délai du CVLT, essai différé du RAVLT',
    },
    'calendar-count': {
      name: 'Compte des jours',
      blurb: 'Un repère est donné. Quel jour tombe cette date ?',
      description:
        'Un jour de référence est fourni — « dans un mois de 31 jours, le 3 est un mardi » — et vous dites quel jour tombe une autre date. Le calcul se fait modulo sept, une base que presque rien d’autre n’utilise, sur une structure que tout le monde a déjà en tête : une semaine qui se répète, un mois qui ne se divise pas par elle. L’item porte son propre repère et ne nomme aucune date réelle : tout ce qu’il faut est à l’écran, rien ne dépend de la date du jour, et la graine le reproduit à l’identique pour toujours. Les niveaux ajoutent le comptage à rebours, puis le passage au mois suivant — où il faut savoir où finit le mois avant même de pouvoir compter.',
      seenIn: 'Calendar Count de Brain Age 2, items de calendrier des batteries d’aptitude et de numératie',
    },
  },

  gen: {
    matrixAttr: {
      number: 'Le nombre de formes',
      position: 'La disposition des formes',
      type: 'La forme',
      size: 'La taille',
      color: 'Le remplissage',
    },
    rules: {
      constant: (attr: string) => `${attr} reste identique sur chaque ligne.`,
      progression: (attr: string, step: number) =>
        `${attr} ${step > 0 ? 'augmente' : 'diminue'} de ${Math.abs(step)} à chaque étape de la ligne.`,
      arithmeticAdd: (attr: string) => `${attr} : la troisième case vaut la première plus la deuxième.`,
      arithmeticSub: (attr: string) => `${attr} : la troisième case vaut la première moins la deuxième.`,
      distributeThree: (attr: string) =>
        `${attr} : les trois mêmes valeurs apparaissent sur chaque ligne, dans un ordre différent.`,
      sameEverywhere: (attr: string) => `${attr} est identique dans toutes les cases.`,
    },

    matrix: {
      prompt: 'Quelle figure complète le motif ?',
      summary: (option: number) =>
        `La réponse ${option} est la seule figure qui satisfasse toutes les règles à la fois.`,
    },

    seriesNumber: {
      prompt: 'Quel nombre prolonge la suite ?',
      summary: (value: number) => `Le terme suivant est ${value}.`,
      sequence: (terms: string) => `Suite : ${terms}`,
      plusMinus: (d: number) =>
        `Chaque terme vaut le précédent ${d > 0 ? `plus ${d}` : `moins ${-d}`}.`,
      times: (m: number) => `Chaque terme vaut le précédent multiplié par ${m}.`,
      timesPlus: (m: number, c: number) =>
        `Chaque terme vaut le précédent multiplié par ${m}, ${c > 0 ? `plus ${c}` : `moins ${-c}`}.`,
      alternating: (a: number, b: number) =>
        `Deux suites alternent : les 1er, 3e, 5e… termes ${a > 0 ? `montent de ${a}` : `descendent de ${-a}`}, tandis que les 2e, 4e, 6e… ${b > 0 ? `montent de ${b}` : `descendent de ${-b}`}.`,
      blocks: (size: number, step: number) =>
        `La suite avance par blocs de ${size} ; chaque bloc est ${step > 0 ? `${step} plus haut` : `${-step} plus bas`} que le précédent.`,
      growingGap: (d0: number, d1: number, d2: number, dd: number) =>
        `Les écarts entre les termes sont ${d0}, ${d1}, ${d2}… — chaque écart ${dd > 0 ? `augmente de ${dd}` : `diminue de ${-dd}`}.`,
      fibonacci: 'Chaque terme est la somme des deux précédents.',
      growingFactor: (r0: number, r1: number, r2: number) =>
        `Chaque terme est multiplié par un facteur qui grandit à chaque étape : ×${r0}, ×${r1}, ×${r2}…`,
    },

    seriesLetter: {
      prompt: 'Quelle lettre prolonge la suite ?',
      summary: (letter: string) => `La lettre suivante est ${letter}.`,
      sequence: (letters: string) => `Suite : ${letters}`,
      positions: (positions: string) => `Positions dans l’alphabet : ${positions}`,
      step: (step: number) =>
        `Chaque lettre avance de ${Math.abs(step)} position${Math.abs(step) === 1 ? '' : 's'} ${step > 0 ? 'vers l’avant' : 'vers l’arrière'} dans l’alphabet.`,
      alternating: (a: number, b: number) =>
        `Deux suites alphabétiques alternent : les 1re, 3e, 5e… lettres se déplacent de ${a > 0 ? `+${a}` : a}, les 2e, 4e, 6e… de ${b > 0 ? `+${b}` : b}.`,
      growingStep: (d0: number, dd: number) =>
        `L’écart entre les lettres augmente de ${dd} à chaque étape : +${d0}, +${d0 + dd}, +${d0 + 2 * dd}…`,
    },

    oddOneOut: {
      prompt: 'Quelle figure n’a pas sa place parmi les autres ?',
      dims: {
        type: 'forme',
        size: 'taille',
        color: 'remplissage',
        count: 'nombre d’éléments',
      },
      summary: (option: number, dim: string) =>
        `La réponse ${option} est l’intrus : sa ${dim} diffère.`,
      shared: (dim: string) => `Toutes les autres figures partagent la même ${dim}.`,
      noise: (dims: string[]) =>
        `${dims.join(' et ')} varient librement et ne constituent pas la règle.`,
    },

    analogy: {
      prompt: 'La première figure devient la deuxième. Appliquez la même transformation à la troisième.',
      summary: (option: number, changes: string[]) =>
        `Réponse ${option}. En passant de la première figure à la deuxième, ${changes.join(', et ')}.`,
      rule: (change: string) => `Transformation : ${change}.`,
      sizeChange: (amount: number) =>
        `la forme ${amount > 0 ? 'grandit' : 'rétrécit'} de ${Math.abs(amount)} cran${Math.abs(amount) === 1 ? '' : 's'}`,
      colorChange: (amount: number) =>
        `le remplissage ${amount > 0 ? 'fonce' : 's’éclaircit'} de ${Math.abs(amount)} cran${Math.abs(amount) === 1 ? '' : 's'}`,
      rotationChange: (degrees: number) => `la forme tourne de ${degrees} degrés`,
      typeChange: (amount: number) =>
        `la forme devient celle située ${Math.abs(amount)} rang${Math.abs(amount) === 1 ? '' : 's'} plus loin dans la série`,
    },

    syllogism: {
      prompt: 'Les deux affirmations sont vraies. Qu’en découle-t-il nécessairement ?',
      noConclusion: 'Aucune conclusion valide ne découle de ces prémisses.',
      propA: (s: string, p: string) => `Tous les ${s} sont des ${p}.`,
      propE: (s: string, p: string) => `Aucun ${sing(s)} n’est un ${sing(p)}.`,
      propI: (s: string, p: string) => `Certains ${s} sont des ${p}.`,
      propO: (s: string, p: string) => `Certains ${s} ne sont pas des ${p}.`,
      summaryValid: (option: number, conclusion: string) => `Réponse ${option} : ${conclusion}`,
      summaryNone: (option: number) => `Réponse ${option} : rien n’en découle avec certitude.`,
      ruleValid: (conclusion: string, models: number) =>
        `« ${conclusion} » est vraie dans chacune des ${models} situations qui satisfont les deux prémisses.`,
      ruleValidOthers:
        'Chacune des autres conclusions admet au moins un contre-exemple — une situation où les prémisses tiennent mais où la conclusion échoue.',
      ruleNone: (models: number) =>
        `Sur les ${models} situations qui satisfont les deux prémisses, chaque conclusion proposée échoue dans au moins une.`,
      ruleNoneHint: (minor: string, major: string) =>
        `Des prémisses peuvent être compatibles avec une relation sans l’imposer. Rien n’est ici contraint entre les ${minor} et les ${major}.`,
    },

    rotation: {
      prompt: 'Quelle forme est celle du haut, après rotation ?',
      summary: (option: number, degrees: number) =>
        `La réponse ${option} est la forme tournée de ${degrees}° dans le sens horaire.`,
      ruleMirrors:
        'Les autres réponses sont des images miroir — retournées, et non tournées. Aucune rotation dans le plan ne permet de les obtenir.',
      ruleHint:
        'Une vérification rapide : repérez un détail asymétrique (une case isolée qui dépasse) et suivez sa position par rapport au reste. Une rotation préserve cette relation ; une réflexion l’inverse.',
    },

    paperFolding: {
      prompt: 'La feuille est pliée, puis perforée. À quoi ressemble-t-elle dépliée ?',
      folds: {
        left: 'la moitié gauche est rabattue sur la droite',
        right: 'la moitié droite est rabattue sur la gauche',
        top: 'la moitié haute est rabattue vers le bas',
        bottom: 'la moitié basse est rabattue vers le haut',
      },
      foldShort: {
        left: 'gauche rabattue à droite',
        right: 'droite rabattue à gauche',
        top: 'haut rabattu vers le bas',
        bottom: 'bas rabattu vers le haut',
      },
      summary: (option: number, punches: number, layers: number, holes: number) =>
        `Réponse ${option} : ${punches} perforation${punches === 1 ? '' : 's'} à travers ${layers} épaisseurs donnent ${holes} trous.`,
      foldStep: (n: number, description: string) => `Pli ${n} : ${description}.`,
      ruleUnfold:
        'Chaque perforation traverse toutes les épaisseurs situées en dessous ; déplier revient donc à la refléter de part et d’autre de chaque pli, dans l’ordre inverse.',
    },

    span: {
      promptForward: 'Saisissez la séquence dans l’ordre où elle est apparue.',
      promptBackward: 'Saisissez la séquence dans l’ordre inverse.',
      summary: (shown: string, expected: string) =>
        `La séquence était ${shown}, la réponse est donc ${expected}.`,
      ruleBackward:
        'L’empan envers demande de stocker la séquence et de l’inverser en même temps — c’est cette manipulation qui en fait une tâche de mémoire de travail plutôt que de simple rétention.',
      ruleForward:
        'L’empan endroit mesure ce que vous pouvez retenir d’un coup, sans manipulation.',
      ruleChunking:
        'Regrouper les éléments par deux ou trois au fur et à mesure allonge l’empan de façon fiable.',
    },

    symbolSearch: {
      prompt: 'L’un des symboles cibles figure-t-il dans le groupe ?',
      yes: 'Oui',
      no: 'Non',
      summaryPresent: 'Oui — l’une des cibles est dans le groupe.',
      summaryAbsent: 'Non — aucune des cibles n’est dans le groupe.',
      ruleMatch:
        'Un symbole ne correspond que si sa forme, son remplissage et son orientation correspondent tous les trois.',
      ruleSpeed:
        'Ce type est évalué sur la vitesse : votre temps de réponse médian compte davantage que votre précision, qui devrait rester proche du plafond.',
    },
    figureWeights: {
      prompt: 'Quel groupe équilibre la dernière balance ?',
      premisesLabel: 'Ces balances s’équilibrent',
      targetLabel: 'Équilibrez celle-ci',
      summary: (group: string) => `${group} l’équilibre.`,
      rulePremise: (heavier: string, ratio: number, lighter: string) =>
        `Un ${heavier} pèse autant que ${ratio} ${plural(lighter, ratio)}.`,
      ruleTarget: (group: string, weight: number) =>
        `Le plateau à égaler contient ${group}, soit ${weight} unités de la forme la plus légère.`,
      ruleCount:
        'C’est le poids qui équilibre, non le nombre d’objets : un groupe comptant le bon nombre de pièces pour un total erroné ne s’équilibrera pas.',
      ruleShapes:
        'Ce ne sont pas non plus les formes : contenir ce que contient l’autre plateau n’équilibre que si l’on en contient autant.',
      quantity: (n: number, shape: string) => `${n} ${plural(shape, n)}`,
      join: (parts: string[]) =>
        parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}`,
    },
    nBack: {
      prompt: (n: number) =>
        n === 1
          ? 'Combien de lettres étaient identiques à celle qui précédait immédiatement ?'
          : `Combien de lettres étaient identiques à celle apparue ${n} rangs plus tôt ?`,
      streamLabel: (n: number) =>
        n === 1 ? 'Repérez les répétitions à 1 rang' : `Repérez les répétitions à ${n} rangs`,
      summary: (count: number, n: number) =>
        `${count} lettres reprenaient celle ${n === 1 ? 'qui précédait immédiatement' : `apparue ${n} rangs plus tôt`}.`,
      ruleWindow: (n: number) =>
        n === 1
          ? 'Une répétition est une lettre identique à celle qui la précède immédiatement.'
          : `Une répétition est une lettre identique à celle apparue ${n} rangs plus tôt — les ${n - 1} lettres intercalées n’entrent pas en compte.`,
      rulePairs: (pairs: string) => `Les positions concernées étaient ${pairs}.`,
      ruleUpdating:
        'Les compter suppose de retenir les dernières lettres et de remplacer la plus ancienne à chaque pas. C’est cette mise à jour, et non la quantité stockée, que ce format mesure.',
    },
    trailMaking: {
      promptA: 'Reliez les cibles à partir de 1, dans l’ordre.',
      promptB: 'Reliez les cibles en alternant nombres et lettres : 1, A, 2, B…',
      summary: (nodes: number, formB: boolean) =>
        formB
          ? `${nodes} cibles, en alternant nombres et lettres.`
          : `${nodes} cibles, dans l’ordre numérique.`,
      ruleSequence:
        'L’ordre, ce sont les nombres croissants. Il n’y a rien à déduire : toute la tâche consiste à trouver la cible suivante et à l’atteindre.',
      ruleAlternate:
        'L’ordre alterne : 1, A, 2, B, et ainsi de suite. Deux suites doivent être tenues en même temps, et chaque bascule est une occasion de perdre sa place dans l’autre.',
      ruleTimed:
        'Ce qui est évalué, c’est le temps mis à finir, non le fait de finir — tout le monde finit. Un clic sur une mauvaise cible est comptabilisé et la série se poursuit.',
      ruleContrast:
        'La mesure à suivre est l’écart entre vos temps sur les deux sortes de plateaux. Ceux qui mêlent nombres et lettres sont appariés aux autres sur la recherche visuelle et la motricité : il ne reste donc que le coût du basculement.',
      next: (label: string) => `Suivant : ${label}`,
      progress: (done: number, total: number) => `${done} sur ${total} reliées`,
      misses: (n: number) => `${n} clic${n === 1 ? '' : 's'} erroné${n === 1 ? '' : 's'}`,
      done: 'Terminé',
      nodeLabel: (label: string) => `Cible ${label}`,
    },
    blockSpan: {
      prompt: (length: number) => `Touchez les ${length} blocs dans l’ordre où ils se sont allumés.`,
      summary: (length: number) =>
        `${length} blocs se sont allumés ; le plateau porte désormais cet ordre en chiffres.`,
      ruleOrder:
        'L’ordre est celui de l’allumage, à l’endroit. Un bloc ne s’allume jamais deux fois dans une même séquence.',
      ruleExact:
        'La séquence entière doit être juste. Quatre blocs sur cinq dans le bon ordre, c’est un essai raté et non quatre cinquièmes de réussite : ce qui se mesure est la survie de la séquence, et une séquence à moitié retenue n’a pas survécu.',
      ruleBoard:
        'Les neuf blocs occupent les mêmes places à chaque item. C’est voulu : une disposition nouvelle à chaque fois vous ferait chercher les blocs avant de pouvoir en retenir l’ordre, et cette recherche serait comptée dans votre empan.',
      ruleSpatial:
        'Les positions se disent mal, et c’est précisément l’intérêt : cette tâche sollicite la part de la mémoire de travail qui retient où sont les choses, plutôt que celle qui se répète des sons. C’est pourquoi un bon empan de chiffres ne prédit pas un bon empan spatial.',
      /** Textes du plateau en direct. */
      ready: (length: number) => `${length} blocs vont s’allumer, un par un. Regardez où.`,
      start: 'Lancer la séquence',
      watching: 'Observez…',
      nowTapThemBack: 'À vous : touchez-les dans l’ordre.',
      progress: (done: number, total: number) => `${done} sur ${total} touchés`,
      undo: 'Annuler le dernier',
      blockLabel: (position: number) => `Bloc ${position}`,
      revealRight: 'C’était bien l’ordre.',
      revealWrong: 'L’ordre est chiffré ci-dessous.',
      legendAnswer: 'Trait plein : l’ordre d’allumage',
      legendTapped: 'Trait pointillé : l’ordre que vous avez touché',
    },
    interference: {
      prompt: 'Combien y en a-t-il ?',
      summary: (count: number, digit: string) =>
        count === Number(digit)
          ? `Il y en a ${count}, et ce sont justement des ${digit} — les deux concordent ici.`
          : `Il y en a ${count}, bien que ce soient des ${digit}.`,
      ruleCongruent:
        'Ici le chiffre et le compte concordent : rien n’était à retenir. Ces essais servent de référence pour mesurer l’interférence.',
      ruleIncongruent: (digit: string, count: number) =>
        `Le chiffre dit ${digit} et il y en a ${count}. Lire le chiffre est automatique, compter ne l’est pas : ${digit} est donc la réponse qui se présente d’abord, et qu’il faut refuser.`,
      ruleInhibition:
        'Ce que ce format mesure, c’est l’inhibition : retenir une réponse automatique et rapide le temps qu’une réponse réfléchie, plus lente, arrive. Ce n’est pas une épreuve de comptage.',
      ruleScoring:
        'La véritable mesure est l’écart entre vos temps sur les deux types d’essais, non votre précision — qui devrait rester élevée. Voyez l’indice d’interférence sur la page de progression.',
    },
    arithmetic: {
      prompt: 'Combien cela fait-il ?',
      summary: (expression: string, value: number) => `${expression} fait ${value}.`,
      ruleSingle: 'Un opérateur, un calcul.',
      ruleLeftToRight:
        'Deux opérateurs de même nature, lus strictement de gauche à droite. Rien ici ne mêle addition et multiplication : aucune règle de priorité n’est donc à retenir — un item dont la réponse en dépendrait mesurerait la convention plutôt que le calcul.',
      ruleUnitsDigit: (digit: number) =>
        `La réponse se termine par ${digit}, et l’une des réponses fausses aussi — délibérément. Le chiffre des unités d’une somme ou d’un produit est fixé par celui des nombres de départ : si une seule réponse se terminait par ${digit}, l’item se résoudrait sans achever le calcul.`,
    },
    headCount: {
      prompt: 'Combien de personnages restaient-ils dans la salle ?',
      summary: (count: number) => `Il en restait ${count} dans la salle.`,
      step: (n: number, arriving: boolean, total: number) =>
        `${n} ${arriving ? 'entrent' : 'sortent'} → ${total}`,
      ruleTrack:
        'Chaque mouvement fait entrer ou sortir des personnages. Ce qu’il faut tenir, c’est le total courant et non les mouvements : additionnez ou soustrayez, puis oubliez le nombre que vous teniez.',
      ruleSteps: (steps: string) => `Pas à pas : ${steps}.`,
      ruleMissedStep:
        'Les autres réponses correspondent à une seule étape mal traitée : un mouvement jamais compté — ce qui laisse le total trop haut s’ils sortaient, trop bas s’ils entraient — ou un mouvement compté à l’envers. Elles se répartissent volontairement de part et d’autre de la bonne, et tout près d’elle : une réponse écartable parce qu’elle est trop éloignée, ou parce qu’elle occupe toujours la même place dans la liste, permettrait de répondre sans avoir regardé.',
    },
    coding: {
      prompt: (digit: string) => `Quel symbole est associé au ${digit} ?`,
      summary: (digit: string, column: number) =>
        `Le ${digit} occupe la colonne ${column} de la légende, et le symbole de cette colonne est la réponse.`,
      ruleLookup:
        'La légende est tout l’item : chaque chiffre est associé à un seul symbole.',
      ruleColumn:
        'Chaque réponse proposée figure quelque part dans la légende : impossible de trouver la bonne par élimination — et l’erreur la plus fréquente consiste à lire la colonne voisine de la bonne.',
      ruleSpeed:
        'Ce type est évalué sur la vitesse : votre temps de réponse médian compte davantage que votre précision, qui devrait rester proche du plafond.',
    },
    highNumber: {
      prompt: 'Lequel vaut le plus ?',
      left: 'Celui de gauche',
      right: 'Celui de droite',
      sides: { left: 'la gauche', right: 'la droite' },
      summary: (value: number, side: string) => `${value}, à ${side}.`,
      ruleCongruent:
        'Ici le plus grand nombre est aussi le plus grand dessin : les deux lectures s’accordent et il n’y avait rien à retenir. Ces essais-là sont la référence à laquelle l’interférence est comparée.',
      ruleIncongruent: (smaller: number, drawnLarger: string) =>
        `${smaller} est dessiné plus grand — il est à ${drawnLarger} — et vaut moins. La taille se lit qu’on l’ait demandé ou non : le plus grand dessin est donc la réponse qui arrive en premier, et il faut la refuser.`,
      ruleDistance: (gap: number) =>
        `Les deux valeurs sont séparées de ${gap}. Plus elles sont proches, plus la comparaison est longue — et plus elle est longue, plus le dessin a le temps d’interférer.`,
      ruleScoring:
        'La vraie mesure est l’écart entre vos temps selon que les deux lectures s’accordent ou non, et non votre précision, qui devrait rester haute.',
    },
    handGame: {
      promptWin: 'Jouez la main qui gagne.',
      promptLose: 'Jouez la main qui perd.',
      hands: { rock: 'Pierre', paper: 'Feuille', scissors: 'Ciseaux' },
      summary: (answer: string, shown: string, win: boolean) =>
        win
          ? `${answer} bat ${shown.toLowerCase()}.`
          : `${answer} perd contre ${shown.toLowerCase()}.`,
      ruleWin:
        'Celui-ci demandait de gagner, c’est-à-dire le coup que vous avez déjà : la réponse arrive sans être calculée.',
      ruleLose:
        'Celui-ci demandait de perdre. C’est la même recherche menée contre une habitude, et c’est l’habitude qui la ralentit : la main gagnante est celle que la main veut jouer.',
      ruleCycle: (rock: string, paper: string, scissors: string) =>
        `${rock} émousse ${scissors.toLowerCase()}, ${scissors.toLowerCase()} coupe ${paper.toLowerCase()}, ${paper.toLowerCase()} enveloppe ${rock.toLowerCase()}.`,
      ruleInhibition:
        'Les deux mauvaises mains veulent chacune dire quelque chose : la main montrée, c’est la transformation qui n’a pas eu lieu ; la troisième main, c’est l’autre consigne — gagner quand on demandait de perdre, autrement dit la réponse automatique qui est passée.',
    },
    serialSubtraction: {
      prompt: 'Où cela retombe-t-il ?',
      summary: (chain: string, value: number) => `${chain} retombe sur ${value}.`,
      ruleSteps: (steps: string) => `Pas à pas : ${steps}.`,
      ruleOneStepOut: (step: number) =>
        `Deux mauvaises réponses sont exactement à ${step} : une soustraction de trop, une de moins. C’est ce que donne la perte du compte, et c’est l’erreur que ce format est fait pour attraper.`,
      ruleCarry:
        'Les deux autres sont à dix : le chiffre des unités juste et un rang supérieur faux, c’est-à-dire la retenue oubliée. Deux réponses se terminent toujours par le même chiffre que la bonne, pour qu’on ne puisse pas trancher sur la seule colonne des unités.',
    },
    mathRecall: {
      prompt: 'Combien cela faisait-il ?',
      summary: (sum: string, value: number) => `${sum} font ${value}.`,
      ruleHold:
        'Rien n’était jamais à l’écran pour être additionné. Chaque nombre devait survivre à l’arrivée du suivant, ce qui revient à retenir du matériel et à le manipuler en même temps — additionner au fil de l’eau était une façon légitime de le faire, et charge la même chose.',
      ruleCarry: (digit: number) =>
        `La bonne réponse se termine par ${digit}, et une mauvaise aussi — délibérément. Sans cela, la somme se retrouverait à partir des seuls chiffres des unités, c’est-à-dire d’un fragment de ce qui vous a été montré.`,
      ruleNoReplay:
        'Il n’y a pas de rediffusion, et c’est le format plutôt qu’une limite : un item qu’on peut revoir mesure le soin apporté à la deuxième vision.',
    },
    timeLapse: {
      prompt: 'Combien de minutes se sont écoulées ?',
      summary: (from: string, to: string, minutes: number) =>
        `De ${from} à ${to}, il s’écoule ${minutes} minutes.`,
      ruleCrossing: (toTheHour: number, after: number) =>
        `Celui-ci franchit l’heure : ${toTheHour} minutes pour l’atteindre, puis ${after} après. Soustraire les seules grandes aiguilles donne ici une fausse réponse, et c’est précisément l’une des réponses proposées.`,
      ruleWithinHour: (from: number, to: number) =>
        `Les deux cadrans sont dans la même heure : les grandes aiguilles suffisent, ${to} moins ${from}. Les petites aiguilles le confirment sans y contribuer.`,
      ruleTicks:
        'Les deux aiguilles se posent sur des repères imprimés : rien ici ne dépend d’une lecture à la minute près. Les réponses sont espacées de cinq pour la même raison — une minute d’écart n’est une lecture à laquelle personne n’aboutit.',
    },
    triangleMath: {
      prompt: 'Remplissez la pyramide.',
      summary: (top: number) => `Le sommet de la pyramide est ${top}.`,
      ruleSum:
        'Chaque case est la somme des deux qui se trouvent juste en dessous : la pyramide se construit donc du bas vers le haut.',
      ruleRows: (rows: string) => `Rangée par rangée : ${rows}.`,
      rulePropagates:
        'Les rangées ne sont pas indépendantes : une case fausse est additionnée dans les deux cases au-dessus d’elle, si bien qu’une seule erreur en bas déplace tout ce qui suit. C’est pourquoi toutes les cases sont demandées et non le seul sommet — la pyramide montre où la chaîne a lâché.',
    },
    tower: {
      prompt: 'Combien de coups, au minimum, pour transformer le plateau de gauche en celui de droite ?',
      summary: (moves: number) => `La solution la plus courte prend ${moves} coups.`,
      ruleOneAtATime: 'Une perle se déplace à la fois, et seule la perle du sommet d’une tige peut bouger.',
      ruleCapacity:
        'Les tiges tiennent trois, deux et une perle. Une tige pleine ne peut en recevoir une autre, et c’est ce qui rend certains chemins plus longs qu’ils n’en ont l’air.',
      ruleMinimum: (moves: number) =>
        `${moves} est le minimum : toutes les dispositions que le plateau permet ont été parcourues, et aucune suite plus courte n’atteint le but.`,
      ruleAway:
        'L’erreur caractéristique est de compter un coup de moins, en sautant celui qui libère une tige — il faut parfois poser une perle là où on ne la veut pas avant qu’une autre puisse aller là où on la veut.',
    },
    tableReasoning: {
      rowLabel: (i: number) => `Équipe ${'ABCD'[i]}`,
      columnLabel: (i: number) => `T${i + 1}`,
      percent: (value: number) => `${value} %`,
      promptRowTotal: (row: string) => `Quel est le total de l’${row} sur tous les trimestres ?`,
      promptColumnTotal: (column: string) => `Quel est le total du ${column}, toutes équipes réunies ?`,
      promptDifference: (larger: string, smaller: string, column: string) =>
        `Au ${column}, de combien l’${larger} dépasse-t-elle l’${smaller} ?`,
      promptMaxRow: 'Quelle équipe a le plus gros total sur l’ensemble des trimestres ?',
      promptAverage: (row: string) => `Quelle est la moyenne par trimestre de l’${row} ?`,
      promptPercent: (row: string, from: string, to: string, direction: 'rise' | 'fall') =>
        `De quel pourcentage l’${row} a-t-elle ${direction === 'rise' ? 'progressé' : 'reculé'} du ${from} au ${to} ?`,
      summaryTotal: (label: string, total: number) => `${label} totalise ${total}.`,
      summaryDifference: (larger: string, smaller: string, column: string, diff: number) =>
        `Au ${column}, l’${larger} devance l’${smaller} de ${diff}.`,
      summaryMaxRow: (row: string, total: number) => `L’${row}, avec ${total}.`,
      summaryAverage: (row: string, average: number) => `L’${row} fait ${average} par trimestre en moyenne.`,
      summaryPercent: (row: string, from: string, to: string, percent: string, direction: 'rise' | 'fall') =>
        `L’${row} a ${direction === 'rise' ? 'progressé' : 'reculé'} de ${percent} du ${from} au ${to}.`,
      ruleAdd: (terms: string, total: number) => `${terms} = ${total}.`,
      ruleAxisRow: 'Lire le long de la ligne, pas le long de la colonne : le total voisin est proposé pour ceux qui ont fait l’inverse.',
      ruleAxisColumn: 'Lire le long de la colonne, pas le long de la ligne : le total voisin est proposé pour ceux qui ont fait l’inverse.',
      ruleSubtract: (a: number, b: number, diff: number) => `${a} − ${b} = ${diff}.`,
      ruleNotSum: (sum: number) => `${sum} est ce qu’on obtient en additionnant les deux cases — la question demandait de combien l’une dépasse l’autre, c’est une différence.`,
      ruleTotals: (totals: string) => `Les quatre totaux : ${totals}.`,
      ruleLure: (row: string, biggest: number) =>
        `L’${row} contient le plus grand chiffre du tableau, ${biggest}, et n’a pas le plus grand total. La case qui attire l’œil n’est pas la réponse à une question sur des sommes.`,
      ruleDivide: (total: number, count: number, average: number) => `${total} ÷ ${count} = ${average}.`,
      rulePercentBase: (from: number, to: number, diff: number, percent: string) =>
        `De ${from} à ${to}, la variation est de ${diff} ; ${diff} sur ${from}, cela fait ${percent}.`,
      rulePercentDirection:
        'La base est toujours le chiffre le plus ancien. Rapporter la variation au chiffre le plus récent donne un autre pourcentage, et c’est le leurre construit pour cela.',
    },
    reactionTime: {
      promptSimple: (trials: number) => `${trials} fois de suite : quand la cible s’allume, touchez-la.`,
      promptChoice: (targets: number, trials: number) =>
        `${trials} fois de suite : l’une des ${targets} cibles va s’allumer. Touchez celle-là.`,
      summarySimple: (trials: number) =>
        `La cible s’est allumée ${trials} fois, et la médiane de vos temps entre le signal et l’appui est ce qui a été enregistré.`,
      summaryChoice: (positions: number[]) => `Les cibles qui se sont allumées, dans l’ordre : ${positions.join(', ')}.`,
      ruleWait:
        'L’attente avant chaque signal est aléatoire, entre une et trois secondes, donc impossible à chronométrer. Restez attentif et laissez-le venir.',
      ruleFalseStart:
        'Une réponse avant le signal est un faux départ et fait échouer le bloc. Ce n’était la réaction à rien.',
      ruleBlock: (trials: number) =>
        `Un item, c’est ${trials} essais, parce qu’un seul temps de réaction n’est que du bruit : la dispersion des essais d’une même personne est une bonne fraction de sa moyenne, si bien que le laboratoire rapporte la médiane d’un bloc et jamais un essai isolé. La médiane est le temps enregistré pour l’item.`,
      ruleSimple:
        'Une seule cible, c’est le temps de réaction simple : détecter et répondre, sans rien décider. Les médianes adultes typiques dépassent un peu deux cents millisecondes ; le nombre affiché ici inclut l’écran et le pointeur, donc comparez-le à vos propres blocs plutôt qu’à un manuel.',
      ruleHick: (targets: number) =>
        `${targets} cibles, c’est le temps de réaction de choix : détecter, identifier laquelle, puis répondre. La loi de Hick dit que le surcoût croît avec le logarithme du nombre d’alternatives, ce qui explique que ce niveau soit plus lent que le précédent d’un pas à peu près constant.`,
      ready: (targets: number, trials: number) =>
        targets === 1
          ? `La cible s’allumera ${trials} fois, chaque fois après une courte attente aléatoire.`
          : `L’une des ${targets} cibles s’allumera, ${trials} fois, chaque fois après une courte attente aléatoire.`,
      start: 'Prêt',
      trial: (n: number, total: number) => `Essai ${n} sur ${total}`,
      go: 'Maintenant !',
      targetLabel: (position: number) => `Cible ${position}`,
      recordLabel: 'Le bloc, essai par essai',
      markLabel: (n: number, lit: number, pressed: number | null) =>
        pressed === null
          ? `Essai ${n} : la cible ${lit} s’est allumée, appui avant le signal`
          : pressed === lit
            ? `Essai ${n} : la cible ${lit} s’est allumée et a été touchée`
            : `Essai ${n} : la cible ${lit} s’est allumée, cible ${pressed} touchée`,
      falseStarts: (n: number) => (n === 1 ? 'Un faux départ : avant le signal.' : `${n} faux départs.`),
      wrongTargets: (n: number) => (n === 1 ? 'Un appui sur une cible qui ne s’était pas allumée.' : `${n} appuis sur des cibles qui ne s’étaient pas allumées.`),
      result: (ms: number, trials: number) => `${ms} ms de médiane sur ${trials}`,
    },
    featureMatch: {
      prompt: 'Les deux panneaux sont-ils identiques ?',
      same: 'Identiques',
      different: 'Différents',
      summarySame: 'Identiques : chaque symbole correspond à celui d’en face.',
      summaryDifferent: (position: number) => `Différents : les symboles en position ${position} ne correspondent pas.`,
      ruleOne:
        'Quand les panneaux diffèrent, exactement une paire diffère, et par exactement un trait : forme, remplissage ou orientation. Une différence grossière se verrait sans comparer ; une différence d’un seul trait doit être trouvée en vérifiant chaque paire, ce qui est toute la tâche.',
      ruleLayout:
        'Les deux panneaux gardent toujours leurs symboles aux mêmes positions, si bien que le partenaire de chaque symbole est juste en face. Comparer est la tâche ; trouver le partenaire ne l’est pas.',
      ruleSpeed:
        'Ce type est noté sur la vitesse : votre temps de réponse médian compte plus que votre précision, qui doit rester proche du plafond.',
    },
    cubeNet: {
      prompt: 'Quel cube peut-on plier à partir de ce patron ?',
      marks: {
        disc: 'un point',
        ring: 'un anneau',
        square: 'un carré plein',
        frame: 'un carré vide',
        plus: 'un plus',
        cross: 'une croix',
      } as Record<import('../cube-geometry').CubeMark, string>,
      cube: (top: string, left: string, right: string) => `un cube avec ${top} dessus, ${left} à gauche et ${right} à droite`,
      netLabel: 'Le patron : six carrés marqués à plat',
      pair: (a: string, b: string) => `${a} et ${b}`,
      summary: (option: number) => `Option ${option} : ces trois faces se rejoignent à un coin du cube plié, et dans cet ordre.`,
      ruleOpposite: (pairs: string[]) =>
        `Deux carrés séparés par un seul carré sur une ligne droite du patron finissent opposés, et deux faces opposées ne se voient jamais ensemble. Ici les paires opposées sont ${pairs.join(' ; ')}.`,
      ruleCorner:
        'Trois faces se rejoignent à chaque coin, et autour du coin elles se suivent dans un ordre fixe. Tourner le cube change la face du dessus, pas l’ordre dans lequel les trois se suivent.',
      ruleMirror:
        'Un cube qui montre les trois bonnes faces dans l’autre sens est l’image miroir, qu’aucun pliage du patron ne peut produire. Choisissez un coin du patron où trois carrés se touchent et suivez-les autour.',
    },
    cubeNetOriented: {
      prompt: 'Quel cube peut-on plier à partir de ce patron, marques dans le bon sens ?',
      marks: {
        disc: 'un point',
        ring: 'un anneau',
        square: 'un carré plein',
        frame: 'un carré vide',
        plus: 'un plus',
        cross: 'une croix',
        arrow: 'une flèche',
        ell: 'un L',
        half: 'un demi-disque',
        wedge: 'un triangle de coin',
        tee: 'un T',
        flag: 'un drapeau',
      } as Record<import('../cube-geometry').CubeMark, string>,
      turned: (mark: string, turns: number) =>
        turns === 0 ? `${mark}, à l’endroit` : turns === 1 ? `${mark}, tourné d’un quart dans le sens horaire` : turns === 2 ? `${mark}, à l’envers` : `${mark}, tourné d’un quart dans le sens antihoraire`,
      cube: (top: string, left: string, right: string) => `un cube avec ${top} dessus ; ${left} à gauche ; ${right} à droite`,
      pair: (a: string, b: string) => `${a} et ${b}`,
      summary: (option: number) => `Option ${option} : ces trois faces se rejoignent à un coin du cube plié, dans cet ordre, chaque marque pointant là où le pliage l’envoie.`,
      ruleOpposite: (pairs: string[]) =>
        `Deux carrés séparés par un seul carré sur une ligne droite du patron finissent opposés, et deux faces opposées ne se voient jamais ensemble. Ici les paires opposées sont ${pairs.join(' ; ')}.`,
      ruleEdges:
        'L’arête qu’un carré partage avec son voisin ne bouge pas au pliage, si bien que le haut d’une marque finit par pointer là où est partie l’arête qu’il visait. Deux cubes peuvent montrer les mêmes trois faces dans le même sens et ne différer que par la rotation d’une marque ; un seul se plie à partir du patron.',
      ruleMirror:
        'Un cube qui montre les trois bonnes faces dans l’autre sens est l’image miroir, qu’aucun pliage du patron ne peut produire — quelle que soit la rotation de ses marques. Choisissez un coin du patron où trois carrés se touchent et suivez-les autour.',
    },
    blockRotation: {
      prompt: 'Laquelle est la forme ci-dessus, tournée ?',
      summary: (option: number, turns: number) =>
        `L’option ${option} est la même forme tournée d’${turns === 1 ? 'un quart de tour' : `${turns} quarts de tour`}. Les autres sont son image miroir ou ont un bloc déplacé.`,
      ruleTurn:
        'Seule la rotation est permise : autour de n’importe quel axe, ou plusieurs à la suite. Choisissez une partie distinctive — un bras, une marche — et suivez où elle va.',
      ruleMirror:
        'Une image miroir a chaque bloc à la place correspondante et reste fausse : aucune rotation ne porte un objet sur son reflet. Chaque objet ici est vérifié différent de son image miroir, sans quoi l’item aurait deux réponses.',
      ruleCount: (cubes: number) =>
        `Chaque option compte ${cubes} blocs et remplit une boîte de même taille, si bien que compter et mesurer ne les distinguent pas. Seul l’agencement le fait.`,
      ruleVisible:
        'Chaque bloc est dessiné là où il se voit. Aucune orientation où un bloc en cache exactement un autre le long de la ligne de vue, ou se trouve dans une poche dont toutes les faces visibles sont couvertes, n’est retenue — l’objet du dessin est donc l’objet entier, et un bloc introuvable est un bloc qui n’existe pas.',
      describe: (blocks: number, layers: string[]) => `une forme de ${blocks} blocs : ${layers.join(' ; ')}`,
      describeLayer: (layer: number, rows: string[]) => `couche ${layer}, ${rows.join(', ')}`,
      describeRow: (row: number, columns: number[]) => `rangée ${row} colonnes ${columns.join(' ')}`,
    },
    gearTrain: {
      prompt: 'La première roue tourne comme l’indique sa flèche. Comment tourne la dernière ?',
      summary: (option: number, clockwise: boolean, speed: string) =>
        `Option ${option} : la dernière roue tourne dans le sens ${clockwise ? 'horaire' : 'antihoraire'}, à ${speed} la vitesse de la première.`,
      ruleDirection: (reversals: number) =>
        `Le sens s’inverse à chaque engrènement et à chaque courroie croisée, et se conserve par une courroie ouverte. Cette chaîne compte ${reversals} inversion${reversals === 1 ? '' : 's'}, donc la dernière roue tourne ${reversals % 2 === 0 ? 'dans le même sens que' : 'dans le sens opposé à'} la première.`,
      ruleSpeed: (first: number, last: number, speed: string) =>
        `À chaque liaison la vitesse est multipliée par la taille de la roue menante sur celle de la roue menée. Sur toute la chaîne ce produit vaut ${speed} ; la première roue fait ${first} et la dernière ${last}.`,
      ruleIdlers:
        'Quand toutes les liaisons sont des engrènements, les roues intermédiaires disparaissent de la vitesse : le produit se réduit à la première roue sur la dernière. Elles comptent encore pour le sens, une inversion chacune.',
      ruleBelts:
        'Une courroie transmet le rapport des tailles comme les dents, puisque le nombre d’une roue est autant son diamètre que son nombre de dents. Ce qu’une courroie change, c’est le sens : ouverte, elle le conserve ; croisée, elle l’inverse.',
      linkNames: { mesh: 'un engrènement', open: 'une courroie ouverte', crossed: 'une courroie croisée' },
      describe: (sizes: string[], links: string[], clockwise: boolean) =>
        `Un train de ${sizes.length} roues, de tailles ${sizes.join(', ')}, reliées par ${links.join(', puis ')}. La première tourne dans le sens ${clockwise ? 'horaire' : 'antihoraire'} ; on demande la dernière.`,
    },
    logicGrid: {
      prompt: (place: number) => `Quelle forme est à la place ${place} ?`,
      summary: (place: number, shape: string) => `La place ${place} contient le ${shape}.`,
      clueIs: (shape: string, place: number) => `Le ${shape} est à la place ${place}.`,
      clueNot: (shape: string, place: number) => `Le ${shape} n’est pas à la place ${place}.`,
      clueLeftOf: (a: string, b: string) => `Le ${a} est quelque part à gauche du ${b}.`,
      clueAdjacent: (a: string, b: string) => `Le ${a} et le ${b} sont côte à côte.`,
      clueNextLeft: (a: string, b: string) => `Le ${a} est juste à gauche du ${b}.`,
      ruleUnique: (clues: number) =>
        `Tous les arrangements des formes ont été confrontés aux ${clues} indices, et tous ceux qui survivent mettent la même forme à la place marquée. Le reste de la rangée n’a pas besoin d’être fixé : la question portait sur une seule place.`,
      ruleMinimal:
        'Chaque indice est nécessaire. Retirez-en un, et deux formes deviennent possibles à la place marquée — il n’y a donc pas de raccourci par un sous-ensemble, et le nombre d’indices compte honnêtement ce qu’il faut combiner.',
      ruleMethod:
        'Partez de l’indice qui dit le plus. « Quelque part à gauche » exclut une forme de la dernière place et une autre de la première ; « côte à côte » apparie deux formes dans des places voisines ; chaque élimination resserre la suivante. Noter ce que chaque place peut encore contenir, dans une petite grille, est la méthode qui donne son nom au casse-tête.',
      placesLabel: 'Les places, de gauche à droite',
      placeLabel: (n: number, asked: boolean) => (asked ? `Place ${n}, celle demandée` : `Place ${n}`),
      shapesLabel: 'Les formes à placer',
    },
    chimpTest: {
      prompt: (count: number) => `${count} nombres sont sur la grille. Touchez le 1 ; le reste s’efface. Puis touchez-les dans l’ordre.`,
      summary: (count: number) => `Les ${count} chiffres étaient là où le plateau les montre maintenant.`,
      ruleMask:
        'Tous les chiffres disparaissent au premier toucher, y compris celui que vous avez touché. Pas de limite de temps avant : regardez autant qu’il le faut, et la mesure est ce qui survit à l’instant où les nombres s’effacent.',
      ruleOrder: 'Touchez les emplacements dans l’ordre croissant, du un au dernier. Un emplacement ne porte jamais deux chiffres.',
      ruleExact:
        'Chaque toucher doit tomber sur la bonne case. Une seule case fausse fait échouer l’item, puisqu’on mesure si la disposition a survécu, et une disposition à moitié retenue n’a pas survécu.',
      ruleAyumu:
        'Le chimpanzé Ayumu d’Inoue et Matsuzawa réussissait avec neuf chiffres, après une exposition d’une fraction de seconde, et battait tous les adultes humains de l’étude. Les plafonds humains ici vont généralement de cinq à huit. Ce n’est pas un défaut : c’est une différence dans ce à quoi sert la mémoire des deux espèces.',
      study: 'Repérez où est chaque nombre. Touchez le 1 quand vous êtes prêt.',
      progress: (done: number, total: number) => `${done} sur ${total} touchés`,
      reveal: 'Les chiffres sont revenus ; un nombre rouge marque un toucher qui a dévié.',
      cellLabel: (position: number) => `Case ${position}`,
      cellNumbered: (numeral: number | undefined) => `Nombre ${numeral}`,
      cellTapped: (position: number, ordinal: number) => `Case ${position}, votre toucher ${ordinal}`,
      cellReveal: (position: number, numeral: number | undefined, tapped: number | undefined) =>
        numeral === undefined
          ? tapped === undefined
            ? `Case ${position}, vide`
            : `Case ${position}, vide, touchée en ${tapped}e`
          : tapped === undefined
            ? `Case ${position} portait ${numeral}, non touchée`
            : `Case ${position} portait ${numeral}, touchée en ${tapped}e`,
    },
    numberLine: {
      prompt: (label: string) => `Où se place ${label} sur cette droite ?`,
      inputLabel: (label: string, min: number, max: number) => `Position de ${label} sur une droite de ${min} à ${max}`,
      valueText: (percent: number) => `à ${percent} % du parcours`,
      place: 'Placer ici',
      summary: (label: string, percent: number) => `${label} se trouve à ${percent} % du parcours de la droite.`,
      resultHit: (offPercent: number) => (offPercent === 0 ? 'Pile dessus.' : `Dans la tolérance : ${offPercent} % de la droite d’écart.`),
      resultRight: (offPercent: number) => `Trop à droite, de ${offPercent} % de la droite.`,
      resultLeft: (offPercent: number) => `Trop à gauche, de ${offPercent} % de la droite.`,
      ruleTolerance: (percent: number) =>
        `Une estimation est juste quand elle tombe à moins de ${percent} % de la longueur de la droite de la vraie place. La réponse conservée est la marque elle-même, si bien qu’un écart est rapporté par sa taille et son sens.`,
      ruleLandmarks:
        'Les extrémités et le milieu sont les repères : jugez d’abord la moitié, puis la moitié de celle-ci. Aucune cible ici n’est assez proche d’une extrémité ou du milieu pour être atteinte sans juger.',
      ruleScore:
        'Une droite qui ne part pas de zéro, ou qui le traverse, se lit par proportion — quelle part du parcours, non quelle grandeur — et les nombres affichés ne servent qu’à fixer l’échelle.',
    },
    goNoGo: {
      prompt: (count: number) => `${count} signaux, l’un après l’autre. Appuyez sur les pleins. N’appuyez pas sur les barrés.`,
      summary: (stops: number[]) => `Les signaux ${stops.join(' et ')} étaient barrés ; les six autres étaient pleins.`,
      ruleGo: 'Un signal plein, c’est le disque qui se remplit. Appuyez pendant qu’il est affiché, ou dans le blanc juste après : plus tard, c’est manqué.',
      ruleStop:
        'Un signal barré, c’est le disque traversé d’un X. Ne faites rien, et continuez à ne rien faire pendant le blanc qui suit. Le X est tracé aussi gras que le remplissage, pour qu’il n’y ait aucun temps de plus à le remarquer.',
      ruleWindow: (ms: number) =>
        `Chaque signal reste affiché ${ms} millisecondes. C’est la seule chose que le niveau change : une fenêtre plus courte force des appuis plus rapides, et un appui plus rapide est plus dur à retenir, ce qui est précisément le mécanisme mesuré.`,
      ruleDonders:
        'La réaction c de Donders : plusieurs signaux, une réponse à un seul type. La réaction simple, c’est détecter et répondre ; la réaction de choix ajoute lequel ; celle-ci ajoute si. Le temps qu’elle prend en plus de la réaction simple est le coût de cette décision, et un appui sur un signal barré est la décision qui arrive trop tard.',
      ready: 'Huit signaux vont se succéder, un à la fois. N’appuyez que sur les pleins.',
      start: 'Prêt',
      running: (n: number, total: number) => `${n} sur ${total}`,
      targetLabel: 'La cible',
      recordLabel: 'Ce qui a été appuyé, signal par signal',
      markLabel: (n: number, go: boolean, pressed: boolean) =>
        `Signal ${n} : ${go ? 'plein' : 'barré'}, ${pressed ? 'appuyé' : 'non appuyé'}`,
      result: (ms: number) => `${ms} ms en moyenne`,
      commission: (n: number) => (n === 1 ? 'Appui sur un signal barré.' : `Appuis sur ${n} signaux barrés.`),
      omission: (n: number) => (n === 1 ? 'Un signal plein manqué.' : `${n} signaux pleins manqués.`),
    },
    patternRecall: {
      prompt: (count: number) => `Touchez les ${count} cases qui se sont allumées.`,
      summary: (count: number) => `${count} cases se sont allumées ; la grille ci-dessous les montre.`,
      ruleSet:
        'Les cases, dans n’importe quel ordre. Ce qu’il faut retenir est l’image, pas une suite — touchez-les comme vous voulez.',
      ruleExact:
        'Il faut les avoir toutes. Quatre cases sur cinq est un essai raté plutôt que l’essentiel d’une réussite : ce qui est mesuré est si le motif a survécu, et un motif à moitié retenu n’a pas survécu.',
      ruleSnapshot:
        'Le motif est affiché un instant puis disparaît, et il a été montré d’un coup. C’est la différence avec l’empan de blocs, qui montre les positions l’une après l’autre : ici, c’est la mémoire qui retient une image qui travaille, pas celle qui répète une liste.',
      ruleGrid:
        'La grille fait toujours quatre sur quatre et l’exposition est toujours la même. Seul le nombre de cases augmente avec le niveau, si bien qu’un niveau veut dire une seule chose.',
      ready: (count: number) => `${count} cases vont s’allumer ensemble, brièvement. Regardez lesquelles.`,
      start: 'Montrer le motif',
      watching: 'Regardez…',
      nowTapThemBack: 'Touchez maintenant les cases qui étaient allumées.',
      progress: (done: number, total: number) => `${done} sur ${total} choisies`,
      cellLabel: (row: number, column: number) => `Ligne ${row}, colonne ${column}`,
      revealRight: 'C’était le motif.',
      revealWrong: 'Le motif est marqué ci-dessous.',
      legendLit: 'Pleine : était allumée',
      legendMissed: 'Anneau : allumée, non touchée',
      legendExtra: 'Croix : touchée, pas allumée',
    },
    pairedAssociates: {
      prompt: (boxes: number) => `${boxes} boîtes vont chacune montrer un symbole. Retrouvez ensuite la boîte qui contenait celui demandé.`,
      summary: (position: number) => `C’était dans la boîte ${position}.`,
      ruleEachOnce:
        'Chaque boîte s’ouvre exactement une fois, dans un ordre mélangé, et montre son symbole environ une seconde. Il n’y a pas de seconde chance.',
      ruleProbe:
        'La question est un symbole, la réponse un emplacement. Retrouver un lieu à partir d’une chose est le sens associatif — le même geste que mettre un nom sur un visage.',
      ruleArbitrary:
        'Les paires sont arbitraires à dessein. Rien dans un symbole ne dit à quelle boîte il appartient, donc rien d’autre que l’apprentissage ne peut aider — c’est ce qui en fait un test honnête de l’apprentissage.',
      ruleInterval:
        'Entre la dernière boîte et la question, un intervalle rempli : une petite grille allume des cases une à une et vous touchez chacune quand elle s’allume. C’est là pour empêcher la répétition mentale. Une question posée aussitôt se répond depuis la mémoire de travail, et une question après une pause vide se répond en se répétant les paires pendant la pause ; une question après une pause remplie ne peut se répondre qu’à partir de ce qui a été stocké. Les touchers ne sont pas notés. Une question des minutes plus tard est plus complète encore, et une série d’entraînement de ce format en pose une pour chaque ensemble une fois l’apprentissage terminé.',
      ready: (boxes: number) => `${boxes} boîtes vont s’ouvrir une à la fois. Retenez ce que chacune contient.`,
      start: 'Ouvrir les boîtes',
      watching: 'Regardez…',
      delay: 'Touchez chaque case quand elle s’allume.',
      distractorLabel: 'L’intervalle rempli',
      cellLabel: (position: number) => `Case ${position}`,
      probe: 'Quelle boîte contenait ceci ?',
      probeDelayed: 'Plus tôt : quelle boîte contenait ceci ?',
      boxLabel: (position: number) => `Boîte ${position}`,
      revealRight: 'C’était cette boîte.',
      revealWrong: 'Les boîtes sont ouvertes ci-dessous ; la bonne est marquée.',
    },
    pairsDelayed: {
      prompt: 'Plus tôt dans cette série : quelle boîte contenait ce symbole ?',
      summary: (position: number) => `C’était la boîte ${position}.`,
      ruleDelayed:
        'Cet ensemble a été appris plus tôt dans la série, et d’autres ont été appris et interrogés depuis. Répondre maintenant, c’est récupérer ce qui a été stocké, non ce qui restait à l’esprit — la mesure que la question immédiate ne pouvait faire.',
      ruleDifferentBox:
        'Le symbole demandé n’est pas celui demandé sur le moment, si bien que la réponse ne peut être le souvenir d’avoir répondu ; elle doit venir de la paire elle-même.',
    },
    changeMaker: {
      prompt: 'Quelles pièces font la monnaie ?',
      priceLine: (price: string) => `L’addition est de ${price}.`,
      tenderedLine: (tendered: string) => `Vous donnez ${tendered}.`,
      summary: (change: string, coins: string) => `La monnaie est de ${change} : ${coins}.`,
      ruleSubtract: (tendered: string, price: string, change: string) =>
        `${tendered} moins ${price} laisse ${change}. Cette partie-là est de l’arithmétique ; ce qui suit est le format.`,
      ruleGreedy: (coins: string) =>
        `Prenez la plus grosse pièce qui tient encore, puis recommencez : ${coins}. Procéder ainsi à chaque étape donne le plus petit nombre de pièces — ce qui est vrai de ces coupures, mais ne l’est pas de toutes les monnaies jamais frappées.`,
      ruleSameCount: (count: number) =>
        `Chaque réponse compte ${count} pièces, délibérément. Si la bonne était la liste la plus courte, on pourrait la désigner sans rien additionner.`,
    },
    calendarCount: {
      prompt: 'Quel jour de la semaine est-ce ?',
      anchorLine: (monthLength: number, date: number, day: string) =>
        `Dans un mois de ${monthLength} jours, le ${date === 1 ? '1er' : date} est un ${day}.`,
      questionLine: (date: number) => `Quel jour tombe le ${date === 1 ? '1er' : date} du même mois ?`,
      questionLineNextMonth: (date: number) =>
        `Quel jour tombe le ${date === 1 ? '1er' : date} du mois suivant ?`,
      summary: (date: number, day: string) => `Le ${date === 1 ? '1er' : date} est un ${day}.`,
      ruleGap: (days: number, forwards: boolean) =>
        `Les deux dates sont séparées de ${days} jours, comptés ${forwards ? 'en avant' : 'à rebours'} depuis celle qui vous était donnée.`,
      ruleCrossing: (monthLength: number, anchor: number, days: number) =>
        `Le mois compte ${monthLength} jours : il en reste donc ${monthLength - anchor} après le ${anchor === 1 ? '1er' : anchor}, et le reste des ${days} déborde sur le suivant. Où commence le mois suivant n’est pas un fait sur les semaines, mais sur la longueur de celui-ci.`,
      ruleModulus: (days: number, weeks: number, remainder: number) =>
        `${days} jours, c’est ${weeks} semaine${weeks === 1 ? '' : 's'} entière${weeks === 1 ? '' : 's'} et ${remainder} de plus. Les semaines ne changent rien : seuls les ${remainder} comptent.`,
      ruleDistractors:
        'Les mauvais jours sont les trois façons de rater ce comptage : compté dans l’autre sens, décalé d’un seul jour, ou revenu sur le jour de départ — ce que donne le fait de traiter l’écart comme un nombre entier de semaines.',
    },
    clockSpin: {
      prompt: 'Quelle heure ce cadran indique-t-il ?',
      summary: (time: string, rotation: number) => `${time}, sur un cadran tourné de ${rotation}°.`,
      ruleTurnBack: (rotation: number) =>
        `Tout le cadran est tourné de ${rotation}° dans le sens horaire, chiffres compris. Trouvez le 12 et la lecture suit : tout le reste est là où il a toujours été, relativement à lui.`,
      ruleHourHand: (hour: number, minute: number) =>
        `La petite aiguille a dépassé ${hour} et se dirige vers la suivante, aux ${minute} minutes du trajet. Elle ne pointe franchement sur un chiffre qu’à l’heure pile, d’où la lecture fausse la plus fréquente : l’heure vers laquelle elle va.`,
      ruleMisreadings:
        'Les autres réponses sont les façons dont un cadran se lit de travers : l’heure suivante au lieu de celle-ci, les deux aiguilles prises l’une pour l’autre, ou la face lue comme un reflet plutôt que comme une rotation.',
    },
  },

  pages: {
    home: {
      title: 'Entraînez-vous aux formats des tests de raisonnement',
      description:
        'Entraînez-vous aux formats d’items utilisés dans les tests de QI et d’aptitude — raisonnement matriciel, suites numériques, syllogismes, rotation mentale, et plus encore. Chaque item est généré à la volée, vérifié comme n’admettant qu’une seule réponse, puis expliqué. Tout fonctionne dans votre navigateur.',
      lede: 'Trente-deux formats d’items issus de la littérature sur les tests d’intelligence, générés à neuf à chaque fois et expliqués après chaque réponse. Sans compte, sans serveur, et sans score à mettre sur un CV.',
      ctaTest: 'Passer un test complet',
      ctaPractice: 'S’entraîner sur un format',
      whatHeading: 'Ce que vous pouvez travailler',
      whatLede:
        'Regroupés par aptitudes larges du modèle de Cattell–Horn–Carroll. Le raisonnement fluide (Gf) est le meilleur indicateur isolé de l’aptitude générale, et aussi le plus facile à générer par procédure — d’où la domination des items de raisonnement abstrait dans tous les tests gratuits que vous avez croisés.',
      seenIn: (tests: string) => `Présent dans : ${tests}`,
      howHeading: 'Comment les items sont fabriqués',
      how: [
        {
          title: 'Générés, jamais stockés',
          body: 'Une graine de huit caractères reproduit un item à l’identique. Il n’existe aucune banque d’items : rien à faire fuiter, rien à apprendre par cœur.',
        },
        {
          title: 'Prouvés à réponse unique',
          body: 'Un solveur distinct redérive chaque item de zéro. Si deux règles différentes conviennent et divergent, l’item est jeté puis régénéré.',
        },
        {
          title: 'Des distracteurs non rétro-ingénierables',
          body: 'Les réponses sont équilibrées pour que la bonne ne soit jamais la plus « typique » — le défaut qui rendait un jeu de données de recherche connu soluble sans même regarder la question.',
        },
        {
          title: 'Expliqués à chaque fois',
          body: 'Comme le générateur a construit l’item à partir d’une règle explicite, il peut toujours énoncer cette règle ensuite. S’entendre dire « faux » n’apprend rien.',
        },
      ],
      clearHeading: 'Une chose à dire clairement',
      clearBody:
        'Ce site ne vous affichera jamais de chiffre de QI. Un vrai score de QI est une comparaison avec un échantillon représentatif de personnes de votre âge, testées dans des conditions standardisées — et aucun site web ne dispose de cela. Tout site qui vous donne un chiffre après dix questions l’invente.',
      clearBodyAfter:
        'Ce que vous pouvez honnêtement obtenir ici, c’est de l’entraînement, et une image fidèle de votre propre précision et de votre vitesse au fil du temps. ',
      clearLink:
        'La version longue, et pourquoi les effets d’apprentissage font que s’entraîner améliore votre score au test plus que votre raisonnement',
    },

    practiceIndex: {
      title: 'Entraînement',
      description:
        'Choisissez un seul format d’item et travaillez-le, avec une difficulté qui s’adapte à vos résultats et une explication après chaque réponse.',
      lede: 'Travaillez un format à la fois. La difficulté s’adapte au fil de la série — trois bonnes réponses d’affilée vous font monter, deux erreurs vous font redescendre — pour vous maintenir au niveau où l’entraînement sert vraiment à quelque chose.',
    },

    sprintIndex: {
      title: 'Contre-la-montre',
      description:
        'Un bloc chronométré : un format, soixante secondes, autant d’items que vous pouvez traiter. Évalué sur ce que vous terminez plutôt que sur un pourcentage.',
      lede: 'Soixante secondes, un seul format, aucune explication avant la fin. C’est le seul endroit du site où le chronomètre fait partie de la mesure au lieu d’être simplement noté à côté.',
      whatHeading: 'Ce que mesure un sprint',
      whatBody:
        'La vitesse de traitement est un construit de vitesse : dans une batterie réelle, le score est le nombre d’items terminés dans une limite imposée, et non le nombre de réponses justes avec tout le temps voulu. Partout ailleurs, ce site enregistre votre temps de réponse et vous laisse le prendre ; ici la limite est réelle, le niveau reste fixe pour tout le bloc, et le score est un débit par minute. Deux de vos propres sprints deviennent ainsi comparables — et cela reste une mesure de vous, sur ce format, ce jour-là, et de rien de plus général.',
      whyFew:
        'Peu de formats figurent ici, et c’est délibéré. Un sprint exige des items traitables en deux ou trois secondes ; un format dont les items en prennent vingt réduit une minute à trois items, ce qui ne mesure rien que l’entraînement libre ne mesure mieux. Les formats qui déroulent une séquence avant qu’on puisse répondre sont exclus d’office : l’essentiel du bloc se passerait à regarder.',
    },

    sprintType: {
      title: (name: string) => `Contre-la-montre — ${name}`,
      description: (name: string) =>
        `Soixante secondes d’items « ${name} » sous chronomètre, évaluées au nombre d’items terminés.`,
      lede: 'Le chronomètre part quand vous partez. Répondre enchaîne aussitôt — aucune explication avant la fin.',
      window: '60 secondes',
      aboutHeading: 'Comment c’est évalué',
      aboutBody:
        'Le chiffre principal est le nombre de réponses justes dans la fenêtre, avec la cadence par minute à côté pour que les séries restent comparables. La précision est affichée aussi, comme garde-fou et non comme score : un débit obtenu au hasard n’est pas un débit. Le niveau est fixé pour tout le bloc, et les résultats de sprint restent séparés de vos statistiques d’entraînement — ce sont deux mesures différentes, et les mélanger déplacerait vos médianes d’entraînement sans le dire.',
    },

    practiceType: {
      aboutHeading: 'À propos de ce format',
      seenIn: (tests: string) => `Présent dans : ${tests}`,
    },

    test: {
      title: 'Test complet',
      description: (items: number) =>
        `Une série mixte sur les ${items} formats, un item chacun, sans retour avant la fin.`,
      lede: (items: number) =>
        `${items} items — un par format, dans un ordre fixe et sans aucun retour avant la fin. Plus proche du ressenti d’une vraie batterie que les séries d’entraînement.`,
      shortLink: 'Peu de temps ? Le test court fait sept items — un par domaine, tirés de la graine.',
      differsHeading: 'En quoi cela diffère d’une vraie batterie',
      differs: (items: number) => [
        'Une vraie batterie est administrée en tête-à-tête par un examinateur formé, avec des consignes, un chronométrage et des règles d’arrêt fixés. Ici, c’est vous, seul, dans un onglet.',
        'Une vraie batterie convertit votre score brut par comparaison à un échantillon d’étalonnage apparié en âge. Il n’y a pas d’échantillon ici : donc pas de centile et pas de QI — seulement vos propres chiffres.',
        'Une vraie batterie comporte de la compréhension verbale, qui ne peut pas être générée par procédure avec des réponses vérifiables. Rien ici ne la mesure.',
        `Un item par format, c’est une seule observation par format : assez pour savoir si vous avez rencontré un format, pas pour dire ce que vous y valez. Les chiffres par domaine regroupent plusieurs formats chacun et sont la seule partie qui mérite d’être lue — et ${items} items restent de toute façon bien trop peu pour estimer quoi que ce soit de stable. Ce n’est pas pour rien que les batteries publiées comptent dix à quinze subtests.`,
      ],
    },

    testShort: {
      title: 'Test court',
      description: (items: number) =>
        `Une série mixte de ${items} items — un par domaine cognitif, le format tiré de la graine — sans retour avant la fin.`,
      lede: (items: number) =>
        `${items} items — un dans chacun des sept domaines, le format de chacun tiré de la graine, et aucun retour avant la fin. Un quart d’heure au plus.`,
      whyHeading: 'Pourquoi sept',
      why: (formats: number) =>
        `Le test complet pose un item de chacun des ${formats} formats, et atteindre chaque format est sa raison d’être. Celui-ci garde la propriété qui compte le plus pour le profil — chaque domaine est atteint — et renonce à l’autre : le format qui représente un domaine est tiré de la graine, si bien que refaire le test sur une nouvelle graine échantillonne les domaines autrement au lieu de reposer les mêmes sept questions. Sept items, c’est une observation par domaine : assez pour remplir le profil, bien trop peu pour en tirer quoi que ce soit.`,
      fullLink: (formats: number) => `Le test complet : un item de chacun des ${formats} formats.`,
    },

    progress: {
      title: 'Progression',
      description:
        'Votre précision, votre vitesse et vos séries par format et par domaine cognitif — stockées uniquement dans ce navigateur.',
      lede: 'Vos chiffres, et ceux de personne d’autre. La précision indique si vous avez compris un format ; le temps médian, si vous l’avez intégré.',
    },

    about: {
      title: 'Ce que ce site mesure, et ce qu’il ne mesure pas',
      description:
        'Comment les tests de QI sont construits, quels formats d’items un programme peut générer et vérifier, et pourquoi ce site n’affiche délibérément aucun score de QI.',
      lede: 'La version honnête. Ce qu’est réellement un test de QI, quelles parties un programme peut légitimement reproduire, et pourquoi le chiffre que vous cherchez probablement ne figure pas ici.',

      procedureHeading: 'Un test de QI est une procédure, pas un ensemble de questions',
      procedureP1:
        'C’est le point le plus mal compris de la psychométrie. Un test est une batterie standardisée de subtests. Votre score brut à chacun est converti en score étalonné par comparaison à un échantillon d’étalonnage — des milliers de personnes appariées à votre âge, testées dans des conditions contrôlées — puis ces scores sont combinés en indices et en un score composite, conventionnellement ramené à une moyenne de 100 et un écart-type de 15.',
      procedureP2:
        'Trois choses donnent un sens à ce chiffre, et toutes trois relèvent de la passation, non des questions :',
      procedureList: [
        'Un échantillon d’étalonnage représentatif auquel se comparer.',
        'Des consignes, un chronométrage, un ordre et des règles d’arrêt fixés.',
        'Une fidélité et une validité publiées — les grandes batteries rapportent des corrélations test-retest de 0,85 à 0,95.',
      ],
      procedureP3:
        'Un programme peut générer des questions qui se comportent comme des items de subtest. Il ne peut pas générer d’étalonnage. Ce seul écart détermine toute la conception de ce site.',

      chcHeading: 'La carte : le modèle CHC',
      chcP1:
        'Presque toutes les batteries modernes s’organisent autour du modèle de Cattell–Horn–Carroll : l’aptitude générale g au sommet, une dizaine d’aptitudes larges en dessous, et quelque soixante-dix aptitudes étroites encore en dessous. Les sept aptitudes larges travaillées ici :',
      chcColCode: 'Code',
      chcColAbility: 'Aptitude',
      chcColFormats: 'Formats disponibles',
      chcNote:
        'Absente de cette liste : Gc, les connaissances acquises — vocabulaire, analogies verbales, culture générale. Cette absence est délibérée et expliquée ci-dessous.',

      familiesHeading: 'Les grandes familles de tests',
      families: [
        {
          name: 'Échelles de Wechsler (WAIS-IV, WISC-V, WPPSI-IV)',
          body: 'Les batteries cliniques les plus utilisées. Dix subtests principaux produisent quatre indices — compréhension verbale, raisonnement perceptif, mémoire de travail, vitesse de traitement — et un QI total. Passation individuelle par un examinateur qualifié.',
        },
        {
          name: 'Stanford–Binet 5',
          body: 'Cinq facteurs (raisonnement fluide, connaissances, raisonnement quantitatif, traitement visuo-spatial, mémoire de travail), chacun mesuré sous forme verbale et non verbale — un plan 5×2, avec des subtests d’aiguillage qui déterminent le point de départ.',
        },
        {
          name: 'Matrices progressives de Raven',
          body: 'Le test non verbal de référence du raisonnement fluide, conçu pour limiter l’effet culturel. La version standard compte 60 items en cinq séries de difficulté croissante ; la version avancée discrimine dans le haut de la distribution. Chaque item est une matrice 3×3 dont la dernière case manque.',
        },
        {
          name: 'Cattell Culture Fair (CFIT)',
          body: 'Conçu explicitement pour réduire la charge culturelle, linguistique et scolaire. Quatre subtests chronométrés : séries, classification, matrices et conditions. Rapporté sur une échelle d’écart-type 24, ce qui explique qu’un « Cattell 148 » corresponde à peu près à un « Wechsler 130 ».',
        },
        {
          name: 'Woodcock–Johnson IV',
          body: 'La batterie la plus explicitement alignée sur le modèle CHC : ses subtests sont délibérément rattachés aux aptitudes larges et étroites de Cattell–Horn–Carroll.',
        },
        {
          name: 'Tests de dépistage courts',
          body: 'Le Wonderlic (50 items variés en 12 minutes) pour la sélection professionnelle ; le CogAT et l’OLSAT comme tests scolaires collectifs ; le NNAT comme dépistage scolaire non verbal.',
        },
      ],

      verbalHeading: 'Pourquoi il n’y a pas de questions de vocabulaire ici',
      verbalP1:
        'Les analogies verbales et le vocabulaire semblent faciles à générer ; ils ne le sont pas. Leur exactitude dépend de faits sur une langue naturelle qui vivent en dehors du générateur. Un programme ne peut produire chaud : froid :: haut : ? que si un humain lui a déjà indiqué que chaud/froid et haut/bas sont des couples d’antonymes — ce qui en fait une base de contenus rédigée à la main avec une clé de correction, et non un générateur.',
      verbalP2:
        'Pire, la réponse n’est même pas unique. Pour haut : ?, la réponse attendue est bas, mais au-dessus, vers le haut et surélevé sont tous défendables selon la relation que l’on infère, et le programme n’a aucun moyen de principe de savoir laquelle vous aviez en tête. Chaque item d’ici doit admettre exactement une réponse dont l’exactitude peut être démontrée : les items verbaux sont donc exclus.',
      verbalP3:
        'C’est pour la même raison que les batteries volontairement « culture fair » — Raven, Cattell, le NNAT — sont purement non verbales, et que pratiquement tous les tests gratuits en ligne reposent sur des matrices.',

      guardsHeading: 'Comment un item est prouvé équitable',
      guardsLede: 'Chaque item généré doit passer trois contrôles avant de vous être présenté.',
      guards: [
        {
          title: '1. Un solveur distinct doit être d’accord',
          body: 'Un solveur indépendant — délibérément différent du code qui a produit l’item — redérive la règle à partir de ce qui est visible et énumère toutes les règles compatibles. Si deux règles compatibles prédisent des réponses différentes, l’item est écarté. C’est pourquoi vous ne verrez jamais 2, 4, 8, ? ici : ×2 prédit 16 et un écart croissant prédit 14, et les deux se défendent.',
        },
        {
          title: '2. Les réponses ne doivent pas trahir la bonne',
          body: 'Un jeu de données de recherche bien connu sur les matrices s’est révélé soluble sans même regarder la question : ses mauvaises réponses étaient fabriquées en modifiant un attribut de la bonne, si bien que la bonne était toujours la plus « typique ». Ici, les huit réponses forment un ensemble équilibré où chaque valeur d’attribut apparaît dans exactement la moitié d’entre elles : ce raccourci n’existe donc pas — et un test tente précisément ce raccourci et confirme qu’il ne fait pas mieux que le hasard.',
        },
        {
          title: '3. Les mauvaises réponses doivent être fausses pour une raison',
          body: 'Les distracteurs sont construits à partir d’erreurs précises : la règle appliquée en colonnes au lieu des lignes, la bonne règle poussée d’un cran de trop, une case simplement recopiée. Ainsi l’explication peut nommer l’erreur que vous avez probablement commise, au lieu de se contenter de vous dire que vous en avez commis une.',
        },
      ],

      /** La démonstration la plus convaincante du site, enfin déployée. */
      proof: {
        heading: 'La vérification, sur un item',
        lede: 'Chaque item généré doit survivre à un solveur qui le re-dérive de zéro. Voici ce que cela écarte.',
        sequence: 'Quel terme vient ensuite ?',
        readingA: 'Lu comme un doublement',
        readingAWork: 'chaque terme vaut le double du précédent',
        readingAAnswer: '16',
        readingB: 'Lu comme un écart croissant',
        readingBWork: 'les écarts sont 2, puis 4, puis 8',
        readingBAnswer: '14',
        verdict:
          'Deux règles collent à ce qui est visible et elles se contredisent : il n’y a donc pas de réponse défendable — et l’item est écarté avant que quiconque le voie.',
        verdictLabel: 'écarté',
      },

      difficultyHeading: 'La difficulté est contrôlée, pas devinée',
      difficultyP1:
        'Les niveaux des suites numériques suivent les opérateurs cognitifs de la littérature sur la génération d’items, par charge croissante : lire une suite unique, puis en repérer deux entrelacées, puis des blocs répétés, puis un écart qui croît d’une constante, puis un multiplicateur qui change lui-même. Ces cinq opérateurs expliquent à eux seuls environ 77 % de la variance de difficulté — la difficulté est ici une propriété de la structure, et non une étiquette collée après coup.',
      difficultyP2:
        'Pour les matrices, la difficulté vient du nombre d’attributs porteurs d’une règle simultanément et du degré d’abstraction de ces règles. Pour la rotation mentale, de l’angle et du nombre de cases — on sait que le temps de réponse croît linéairement avec l’angle de rotation, ce qui en fait un réglage bien maîtrisé.',

      automationHeading: 'Pourquoi la WAIS ne peut pas être mise en ligne, et les items de type Raven si',
      automationBody:
        'La ligne de partage est le format de réponse, pas le prestige du test. Les batteries à réponse fermée — Raven, le Cattell CFIT, le Wonderlic, le NNAT, ICAR — sont intégralement corrigibles par machine, d’où leurs versions web. La famille Wechsler ne l’est pas : Similitudes, Vocabulaire et Compréhension sont des réponses verbales ouvertes cotées selon une grille, et les Cubes sont une manipulation physique, chronométrée et observée par un examinateur. Cette frontière est exactement celle de ce que couvre ce site, et c’est la même que la section sur le vocabulaire atteint par l’autre bout : ce qu’un programme peut générer et ce qu’un programme peut corriger se révèlent être le même ensemble.',

      ceilingHeading: 'Là où l’échelle s’arrête',
      ceilingP1:
        'Les batteries standard perdent leur résolution dans le haut de la distribution. Une WAIS ou un Raven avancé n’a ni assez de cas normatifs ni assez d’items discriminants bien au-delà de 145–160 : près du plafond, une seule erreur d’inattention déplace le score de plusieurs points, si bien que l’erreur de mesure dépasse la différence mesurée.',
      ceilingP2:
        'Toute une sous-culture de tests « haute gamme » prétend offrir une résolution jusqu’à 190. Elle l’obtient en supprimant le chronomètre et en passant à des réponses ouvertes — ce qui élimine le hasard, mais fait aussi mesurer la persévérance, le temps libre et le goût des casse-têtes autant que le raisonnement. Leurs étalonnages proviennent de volontaires auto-sélectionnés ayant choisi de passer des semaines sur une série d’énigmes, soit à peu près l’échantillon le moins représentatif possible, et les taux de rareté au-delà d’environ quatre écarts-types supposent que la courbe normale tient dans une queue de distribution que personne n’a vérifiée.',
      ceilingP3:
        'La difficulté s’arrête donc ici au niveau 5, et il s’agit d’une échelle d’entraînement, pas d’une échelle de mesure. Si les items les plus durs vous paraissent trop faciles, c’est une vraie limite de cette conception — et le remède habituel coûte plus cher qu’il ne rapporte.',

      notMeasuredHeading: 'Ce qu’un test de QI ne mesure pas du tout',
      notMeasuredLede:
        'Même parfaitement administrée, une batterie mesure l’efficacité de certains circuits de raisonnement et de traitement de l’information. Ce n’est pas la mesure d’un esprit. Hors de son champ :',
      notMeasured: [
        {
          title: 'La créativité divergente',
          body: 'Produire des idées originales hors d’un cadre coté. Les items à réponse unique sont, par construction, le concept inverse — tout ce site repose sur l’existence d’une seule réponse défendable.',
        },
        {
          title: 'L’intelligence émotionnelle et sociale',
          body: 'L’empathie, la régulation des émotions, la lecture d’une situation, la négociation, la tolérance au stress.',
        },
        {
          title: 'La compétence pratique et adaptative',
          body: 'La débrouillardise, le jugement en situation, la résolution de problèmes du quotidien. Les échelles de comportement adaptatif existent comme instruments distincts précisément parce que le QI total ne couvre pas cela.',
        },
        {
          title: 'La personnalité et la conation',
          body: 'La conscienciosité, la curiosité, la persévérance, la motivation. Dans bien des domaines, ces traits prédisent les résultats concrets au moins aussi bien que g.',
        },
      ],
      notMeasuredClose:
        'Cela s’applique récursivement à ce site. Une précision élevée sur ces quarante et un formats est une information sur ces quarante et un formats, et sur rien d’autre.',

      difficultyP3:
        'Ce qui ne revient pas à un étalonnage. Les paliers sont conçus à partir d’opérateurs cognitifs publiés — un ordonnancement défendable — mais aucun item ne porte ici de paramètre de difficulté estimé sur des données de réponse réelles, ce qu’entend la théorie de réponse à l’item par « difficulté ». L’échelle adaptative est donc un escalier qui vous maintient près de votre propre taux de réussite, pas une estimation de votre aptitude.',
      limitsHeading: 'Les limites, dites clairement',
      limits: [
        {
          title: 'Pas d’étalonnage, donc pas de score.',
          body: 'Sans échantillon représentatif auquel vous comparer, un centile ou un « QI 132 » serait inventé. Ce site rapporte la précision, la vitesse et l’évolution dans le temps, c’est-à-dire ce qu’il peut réellement mesurer.',
        },
        {
          title: 'Les effets d’apprentissage sont importants — et c’est bien le sujet.',
          body: 'Repasser un test une deuxième fois augmente généralement le score de 5 à 15 points, et l’effet est le plus fort pour les formats nouveaux comme le raisonnement matriciel — précisément ce qu’un site d’entraînement fait travailler. C’est pour cette raison que la pratique clinique recommande au moins douze mois entre deux passations d’un même instrument. S’entraîner vous rend meilleur à la tâche. Rien ne montre sérieusement que cela élève g.',
        },
        {
          title: 'Les étalonnages vieillissent.',
          body: 'L’effet Flynn — une hausse moyenne d’environ 3 points par décennie dans les pays développés — explique le réétalonnage des batteries tous les 15 à 20 ans. Toute table de conversion figée se périme.',
        },
        {
          title: 'Sans surveillance et auto-sélectionné.',
          body: 'Vous vous testez vous-même, au moment de votre choix, dans un environnement que personne ne contrôle, votre téléphone à portée de main. C’est la critique classique des tests en ligne, et elle s’applique ici pleinement.',
        },
        {
          title: 'Rien ici n’est copié d’un test publié.',
          body: 'Les items réels de Wechsler, Raven et Cattell sont protégés par le droit d’auteur et souvent couverts par le secret des affaires. Chaque item de ce site est généré de zéro. Les formats, eux, sont décrits dans la littérature publique et ne sont pas protégeables en tant que tels. Les noms de tests apparaissent ici à titre descriptif, pour indiquer à quel instrument publié un format ressemble — jamais comme argument commercial. Ce site n’est affilié à aucun d’eux, n’est approuvé par aucun d’eux et n’en est la version d’aucun.',
        },
      ],

      dataHeading: 'Vos données',
      dataBodyBefore:
        'Tout est conservé dans le localStorage de ce navigateur et ne quitte jamais votre appareil — le site est un ensemble de fichiers statiques, sans aucun serveur à qui envoyer quoi que ce soit. Les sessions sont stockées sous forme de graines, et non d’items : c’est pourquoi l’historique complet tient en quelques kilo-octets. Vous pouvez l’exporter, le réimporter ailleurs, ou le supprimer depuis la ',
      dataLink: 'page de progression',
      dataBodyAfter: '.',

      sourcesHeading: 'Sources',
      sources: [
        'Zhang et al., RAVEN: A Dataset for Relational and Analogical Visual rEasoNing, CVPR 2019 — le schéma attributs/règles utilisé pour les matrices.',
        'Hu et al., Stratified Rule-Aware Network (I-RAVEN) — le défaut « aveugle au contexte » des distracteurs de RAVEN et sa correction.',
        'Wang & Su, Automatic Generation of Raven’s Progressive Matrices, IJCAI 2015 — critères de bonne formation et typologie des erreurs pour les distracteurs.',
        'Hornke & Habon (1986) — le premier jeu de règles procédurales pour les matrices de type Raven.',
        'Arendasy & Sommer ; Zhang et al. — les opérateurs cognitifs ANSIG pour la difficulté des suites numériques.',
        'Shepard & Metzler (1971) ; Vandenberg & Kuse (1978) — la rotation mentale.',
        'Schneider & McGrew (2018) — le cadre de Cattell–Horn–Carroll.',
        'Flynn ; Kanaya, Scullin & Ceci — l’effet Flynn et le réétalonnage.',
        'Condon & Revelle, l’International Cognitive Ability Resource (ICAR) — la seule banque d’items ouverte, calibrée par TRI et correctement licenciée. Délibérément non utilisée ici : une banque figée de quelques dizaines d’items s’épuise en une seule session, ce qui est précisément le problème que la génération résout.',
      ],
      sourcesNote:
        'Les notes de recherche complètes, l’analyse de générabilité et l’évaluation des bibliothèques se trouvent dans le répertoire docs/ du dépôt.',
    },

    terms: {
      title: 'Conditions d’utilisation',
      description:
        'Ce qu’est ce site, ce qu’il n’est pas, et les conditions dans lesquelles il est mis à disposition. Il ne délivre aucun score de QI et ne constitue pas un instrument d’évaluation ou de diagnostic.',
      lede: 'Ce site propose un entraînement à des formats de questions de raisonnement. Il ne délivre aucun score de QI, ne constitue pas un test psychométrique et ne remplace en aucun cas l’évaluation d’un psychologue.',
      updated: 'Dernière mise à jour : août 2026',
      sections: [
        {
          heading: 'Objet du site',
          body: [
            'Ce site met à disposition, gratuitement, des exercices générés par algorithme reprenant les formats de questions utilisés dans les tests d’aptitude et d’intelligence. Sa finalité est pédagogique et récréative : comprendre comment ces items sont construits et s’y entraîner. Il fonctionne intégralement dans le navigateur, sans compte et sans serveur.',
          ],
        },
        {
          heading: 'Ce site n’est pas un instrument d’évaluation',
          body: [
            'Aucun score de QI, percentile, rang ou niveau n’est produit, et aucun ne peut l’être : un score de QI est une comparaison à un échantillon d’étalonnage représentatif, passée dans des conditions standardisées, ce dont ce site ne dispose pas. Les résultats affichés (justesse, temps de réponse, progression) ne décrivent que vos performances sur ce site.',
            'En particulier, ils ne permettent pas de détecter, confirmer ou écarter un haut potentiel intellectuel, un trouble des apprentissages, un déficit cognitif ou toute autre condition. Seul un psychologue ou un neuropsychologue qualifié peut réaliser une telle évaluation, au moyen d’une batterie étalonnée passée en face-à-face. Ce site ne doit servir de base à aucune décision d’orientation, de recrutement, de scolarité ou de santé.',
          ],
        },
        {
          heading: 'Absence de garantie',
          body: [
            'Le contenu est fourni « en l’état », sans garantie d’exactitude, d’exhaustivité, de disponibilité ni d’adéquation à un usage particulier. Les items sont générés et vérifiés automatiquement ; malgré les contrôles mis en place, une erreur dans un énoncé, une explication ou une réponse attendue reste possible.',
            'Aucun résultat, aucune amélioration et aucune réussite à un test ultérieur n’est garanti — l’entraînement améliore la performance à l’exercice pratiqué, ce qui ne se transpose pas nécessairement ailleurs.',
          ],
        },
        {
          heading: 'Limitation de responsabilité',
          body: [
            'L’auteur ne saurait être tenu responsable d’un dommage direct ou indirect résultant de l’utilisation du site, de l’interprétation de ses résultats ou d’une décision prise sur leur fondement. L’utilisation du site relève de votre seule responsabilité.',
          ],
        },
        {
          heading: 'Propriété intellectuelle et marques',
          body: [
            'Le code du site est publié sous licence MIT ; les textes explicatifs sont librement consultables pour un usage personnel, avec citation courte et lien en cas de reprise. Aucun item d’un test publié n’est reproduit : toutes les questions sont engendrées par un algorithme à partir de principes logiques décrits dans la littérature scientifique, lesquels ne sont pas protégeables.',
            'Les noms de tests cités (WAIS, WISC, Raven’s Progressive Matrices, Cattell, Wonderlic, NNAT, etc.) sont des marques appartenant à leurs titulaires respectifs et ne sont mentionnés qu’à titre descriptif, pour situer un format de question. Ce site n’est ni affilié à ces éditeurs, ni approuvé par eux, et ne propose aucune version en ligne de leurs tests.',
          ],
        },
        {
          heading: 'Liens et outils externes',
          body: [
            'Les références bibliographiques et liens externes sont fournis à titre documentaire ; l’auteur n’a aucun contrôle sur leur contenu et n’en assume pas la responsabilité.',
          ],
        },
        {
          heading: 'Données personnelles',
          body: [
            'Le site est un ensemble de fichiers statiques : il n’y a aucun serveur applicatif, aucun compte, aucun cookie de mesure d’audience et aucun traceur. Vos réponses, vos sessions et vos préférences sont conservées uniquement dans le stockage local (localStorage) de votre navigateur, sur votre appareil, et ne sont transmises nulle part. Vous pouvez les exporter, les réimporter ou les effacer à tout moment depuis la page Progression.',
            'L’hébergeur (GitHub Pages) peut, de son côté, journaliser des données techniques de connexion selon ses propres conditions.',
          ],
        },
        {
          heading: 'Modifications, disponibilité et droit applicable',
          body: [
            'Le contenu du site et les présentes conditions peuvent évoluer sans préavis ; la version en ligne fait foi. La disponibilité du site n’est pas garantie, l’hébergement étant assuré par GitHub Pages.',
            'Les présentes conditions sont soumises au droit français ; à défaut de résolution amiable, les tribunaux français sont compétents. La version française fait foi en cas de divergence.',
          ],
        },
      ],
      publisherLabel: 'Éditeur',
      publisher: 'TODO — publisher name not yet supplied (see docs/PLAN-2026-08.md §1.2)',
      contactLabel: 'Contact',
      contact: 'https://github.com/flex-your-neurons/flex-your-neurons.github.io/issues',
      hostLabel: 'Hébergeur',
      host: 'GitHub, Inc., 88 Colin P. Kelly Jr Street, San Francisco, CA 94107, USA',
    },

    redirect: {
      title: 'Choix de votre langue…',
      body: 'Si la redirection ne se fait pas automatiquement, choisissez une langue :',
    },
  },
};


/** "1", "1 and 3", "1, 2 and 4" — a readable list for a screen reader. */
function listPhrase(items: string[], conjunction: string): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}

export default fr;
