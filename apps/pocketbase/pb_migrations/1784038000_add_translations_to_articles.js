/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("articles");

  if (!collection.fields.getByName("translations")) {
    collection.fields.add(new JSONField({
      name: "translations",
      required: false
    }));
  }

  if (!collection.fields.getByName("translation_languages")) {
    collection.fields.add(new JSONField({
      name: "translation_languages",
      required: false
    }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("articles");
  collection.fields.removeByName("translations");
  collection.fields.removeByName("translation_languages");
  return app.save(collection);
});
