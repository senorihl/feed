import { Translation } from ".";

export const fr: Translation = {
  screens: {
    feeds: "Flux",
    settings: "Paramètres",
  },
  global: {
    enable: "Activer",
    disable: "Desactiver",
    enabled: "Activé",
    disabled: "Désactivé",
  },
  settings: {
    addFeed: "Ajouter un flux",
    feeds: "Flux",
    locale: "Langage",
    darkMode: "Mode sombre",
    "darkMode-auto": "Automatique",
    preferences: "Préférences",
    clearCache: "Nettoyer le cache",
    openLinksWithinApp: "Ouvrir les liens dans l’appli",
    popin: {
      feedUrl: "Adresse du flux",
      feedUrlHelper: "Merci de fournir une adresse valide.",
      feedUrlError:
        "L’adresse n’est pas valide ou le contenu n’est pas valide.",
    },
  },
  feed: {
    lastContentOn: "Mis à jour le %{date}",
    updatedOn: "Récupéré le %{date}",
    refreshing: "Mise à jour",
    refresh: "Tirer vers le bas pour mettre à jour",
    updateAll: "Tout mettre à jour",
  },
};
