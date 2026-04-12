/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("players");

  const record0 = new Record(collection);
    record0.set("name", "Test Player");
    record0.set("ranking", 100);
    record0.set("country", "USA");
    record0.set("points", 5000);
    record0.set("age", 25);
    record0.set("source", "atp");
    record0.set("profile_url", "https://example.com/test");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})
