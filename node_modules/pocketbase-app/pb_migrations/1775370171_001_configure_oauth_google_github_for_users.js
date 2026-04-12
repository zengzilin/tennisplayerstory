/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const newProviders = [
    {
        "name": "google",
        "clientId": "356169429672-6lp4a3eh0hl792paffd3ifs79d36l4e2.apps.googleusercontent.com",
        "clientSecret": "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",
        "authURL": "",
        "tokenURL": "",
        "userInfoURL": "",
        "displayName": "",
        "pkce": null
    },
    {
        "name": "github",
        "clientId": "Ov23liIp5Js103tdrPAx",
        "clientSecret": "8875621cc84b53bfb7c91f741504be0e98779bef",
        "authURL": "",
        "tokenURL": "",
        "userInfoURL": "",
        "displayName": "",
        "pkce": null
    }
];

  // Upsert: keep providers not in newProviders, then add/replace with newProviders
  collection.oauth2.providers = [
    ...collection.oauth2.providers.filter(p =>
      !newProviders.find(np => np.name === p.name)
    ),
    ...newProviders
  ];
  collection.oauth2.enabled = true;
  collection.oauth2.mappedFields = {
    id: "",
    name: "name",
    username: "",
    avatarURL: "avatar"
  };

  return app.save(collection);
}, (app) => {
  // Rollback: remove the added providers
  const collection = app.findCollectionByNameOrId("users");
  const providerNamesToRemove = ["google", "github"];
  collection.oauth2.providers = collection.oauth2.providers.filter(p =>
    !providerNamesToRemove.includes(p.name)
  );
  if (collection.oauth2.providers.length === 0) {
    collection.oauth2.enabled = false;
  }
  return app.save(collection);
})
