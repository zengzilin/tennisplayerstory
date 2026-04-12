/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("articles");

  const existing = collection.fields.getByName("tags");
  if (existing) {
    if (existing.type === "json") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("tags"); // exists with wrong type, remove first
  }

  collection.fields.add(new JSONField({
    name: "tags",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("articles");
  collection.fields.removeByName("tags");
  return app.save(collection);
})
