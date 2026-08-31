//rules.js
export class Rule {
  constructor(testNumber = 1, difficulty = 'easy', isValidation = false) {
    this.testNumber = testNumber;
    this.description = "Objectif non défini";
    this.difficulty = difficulty;
    this.isValidation = isValidation;
    this.targetState = Array(9).fill(0);
    this.initialState = Array(9).fill(0); // état de départ du plateau (tout éteint par défaut)
    this.ruleCode = [];
    this.hasValidation = false;
    this.validationQuestions = [];
  }

  // Méthode async pour charger les données
  async load() {
    const jsonPath = `ressources/rules/${this.difficulty}/test${this.testNumber}.json`;
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} pour ${jsonPath}`);
      }
      const data = await response.json();

      this.ruleCode = data.rule || this.ruleCode;
      this.description = data.description || this.description;
      this.targetState = data.targetState || this.targetState;
      this.initialState = data.initialState || this.initialState;
      this.validationQuestions = data.validationQuestions || [];
      this.hasValidation = this.validationQuestions.length > 0;

      console.log(`Règle test ${this.testNumber} (${this.isValidation ? 'validation' : 'normal'}) chargée avec succès`);
    } catch (err) {
      console.error(`Impossible de charger ${jsonPath}`, err);
    }
  }

  apply(clickedIndex, model) {

    try {
        const code = this.ruleCode.join("\n");
        const fn = new Function('index', 'buttons', 'historiques', code);
        fn(clickedIndex, model.buttons, model.historiques);
      } catch (e) {
        console.error(`Erreur dans la règle du test ${this.testNumber}:`, e);
      }
    }

  // Prédit l'état résultant en appliquant la règle à un état initial donné,
  // sans toucher l'état courant du jeu. Sert à valider les réponses.
  // clickButton est le numéro du bouton (1..9). Renvoie un tableau de 0/1.
  predict(initialState, clickButton, historique = []) {
    const buttons = (initialState || []).map(v => !!v);
    try {
      const code = this.ruleCode.join("\n");
      const fn = new Function('index', 'buttons', 'historiques', code);
      fn(clickButton - 1, buttons, historique || []);
    } catch (e) {
      console.error(`Erreur lors de la prédiction (test ${this.testNumber}):`, e);
    }
    return buttons.map(b => b ? 1 : 0);
  }
}