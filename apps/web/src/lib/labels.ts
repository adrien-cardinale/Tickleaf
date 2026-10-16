function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular
}

export const labels = {
  app: {
    name: "Tickleaf",
  },
  boot: {
    opening: "Ouverture de vos tâches…",
    openFailed: "Impossible d’ouvrir la base locale",
    noIndexedDb:
      "Le stockage du navigateur (IndexedDB) est indisponible. Quittez la navigation privée ou autorisez le stockage pour ce site.",
    retry: "Réessayer",
    unexpected: "Erreur inattendue",
  },
  nav: {
    views: "Vues",
    inbox: "Boîte de réception",
    today: "Aujourd’hui",
    upcoming: "À venir",
    completed: "Terminées",
    projects: "Projets",
    newProject: "Nouveau projet",
    projectName: "Nom du projet",
    projectNamePlaceholder: "Nom du projet, puis Entrée",
  },
  search: {
    label: "Rechercher",
    placeholder: "Rechercher dans la vue…",
  },
  theme: {
    title: "Thème",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
  },
  quickAdd: {
    label: "Ajouter une tâche",
    placeholder: "Ajouter une tâche…",
    placeholderToday: "Ajouter une tâche pour aujourd’hui…",
    placeholderProject: (project: string) => `Ajouter une tâche dans ${project}…`,
    submit: "Ajouter",
    hintBefore: "Tape",
    hintOr: "ou",
    hintAfter: "dans la phrase.",
    hintShortcut: "pour écrire.",
    hintTokens: ["demain", "lundi", "dans 3 jours"],
  },
  views: {
    today: {
      title: "Aujourd’hui",
      overdue: "En retard",
      reschedule: "Reporter à aujourd’hui",
      section: "Aujourd’hui",
      emptyAfterOverdue: "Plus rien de prévu pour aujourd’hui.",
      empty: "Journée libre. Ajoute une tâche ou profite.",
    },
    upcoming: {
      title: "À venir",
      description: "Les 7 prochains jours, puis le reste.",
      emptyDay: "Rien de prévu.",
      later: "Plus tard",
      empty: "Aucune échéance à venir.",
    },
    completed: {
      title: "Terminées",
      description: (count: number) =>
        `${count} ${plural(count, "tâche", "tâches")} ${plural(count, "terminée", "terminées")}`,
      section: "Historique",
      empty: "Aucune tâche terminée pour l’instant.",
      restore: "Restaurer",
    },
    inbox: {
      title: "Boîte de réception",
      description: "Les tâches sans projet, à trier.",
      section: "À trier",
      empty: "Boîte vide. Bien joué.",
    },
    project: {
      fallbackTitle: "Projet",
      description: (count: number) =>
        `${count} ${plural(count, "tâche", "tâches")} ${plural(count, "ouverte", "ouvertes")}`,
      section: "Tâches",
      empty: "Aucune tâche ouverte dans ce projet.",
      notFound: "Ce projet n’existe pas ou a été archivé.",
      backToInbox: "Aller à la boîte de réception",
      actions: "Actions du projet",
      rename: "Renommer",
      renameLabel: "Nom du projet",
      archive: "Archiver",
      archiveTitle: "Archiver ce projet ?",
      archiveDescription:
        "Le projet disparaît de la barre latérale. Ses tâches ouvertes retournent dans la boîte de réception.",
      cancel: "Annuler",
    },
    emptySection: "Rien ici.",
  },
  task: {
    complete: (title: string) => `Terminer : ${title}`,
    reopen: (title: string) => `Rouvrir : ${title}`,
    untitled: "Sans titre",
  },
  due: {
    today: "Aujourd’hui",
    tomorrow: "Demain",
    yesterday: "Hier",
  },
  detail: {
    title: "Tâche",
    description: "Modifiez la tâche. Les changements sont enregistrés automatiquement.",
    fieldTitle: "Titre",
    fieldDescription: "Description",
    descriptionPlaceholder: "Notes, liens, contexte…",
    fieldDue: "Échéance",
    fieldPriority: "Priorité",
    fieldProject: "Projet",
    inbox: "Boîte de réception",
    created: (date: string) => `Créée le ${date}`,
    completed: (date: string) => `Terminée le ${date}`,
    delete: "Supprimer",
  },
  priority: {
    1: "P1 · Urgent",
    2: "P2 · Haute",
    3: "P3 · Normale",
    4: "P4 · Basse",
  },
  toast: {
    undo: "Annuler",
    completed: "Tâche terminée",
    reopened: "Tâche rouverte",
    added: "Tâche ajoutée",
    addedWith: (where: string) => `Ajoutée : ${where}`,
    deleted: "Tâche supprimée",
    rescheduled: (count: number) =>
      `${count} ${plural(count, "tâche", "tâches")} ${plural(count, "reportée", "reportées")}`,
    projectCreated: (name: string) => `Projet « ${name} » créé`,
    projectArchived: (name: string) => `Projet « ${name} » archivé`,
    failed: "Action impossible",
  },
  pwa: {
    updateReady: "Mise à jour disponible",
    reload: "Recharger",
    offlineReady: "Tickleaf fonctionne maintenant hors ligne",
  },
  notFound: {
    title: "Page introuvable",
    description: "Cette adresse ne correspond à aucune vue.",
    back: "Retour à Aujourd’hui",
  },
  error: {
    title: "Erreur",
    loadFailed: "Impossible d’afficher cette vue",
  },
  seed: {
    projects: ["Travail", "Maison", "Perso"],
    tasks: [
      {
        title: "Relire le rapport de projet",
        description: "Chapitres 3 et 4, puis renvoyer les commentaires.",
        dueOffset: -1,
        priority: 1,
        projectIndex: 0,
      },
      { title: "Payer la facture d’électricité", dueOffset: 0, priority: 2, projectIndex: 1 },
      { title: "Acheter des ampoules", dueOffset: 0, priority: 4, projectIndex: 1 },
      { title: "Appeler le dentiste", dueOffset: 1, priority: 3, projectIndex: 2 },
      { title: "Trier les photos de l’été", dueOffset: null, priority: 4, projectIndex: null },
    ],
  },
} as const
