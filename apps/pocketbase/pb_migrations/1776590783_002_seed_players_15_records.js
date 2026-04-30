/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("players");

  const record0 = new Record(collection);
    record0.set("name", "Jannik Sinner");
    record0.set("ranking", 1);
    record0.set("country", "Italy");
    record0.set("points", 12000);
    record0.set("age", 23);
    record0.set("source", "atp");
    record0.set("profile_url", "https://www.atptour.com/en/players/jannik-sinner");
    record0.set("recent_results", ["W", "W", "L", "W", "W"]);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("name", "Carlos Alcaraz");
    record1.set("ranking", 2);
    record1.set("country", "Spain");
    record1.set("points", 11500);
    record1.set("age", 21);
    record1.set("source", "atp");
    record1.set("profile_url", "https://www.atptour.com/en/players/carlos-alcaraz");
    record1.set("recent_results", ["W", "W", "W", "L", "W"]);
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.set("name", "Novak Djokovic");
    record2.set("ranking", 3);
    record2.set("country", "Serbia");
    record2.set("points", 11000);
    record2.set("age", 37);
    record2.set("source", "atp");
    record2.set("profile_url", "https://www.atptour.com/en/players/novak-djokovic");
    record2.set("recent_results", ["W", "L", "W", "W", "L"]);
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    record3.set("name", "Rafael Nadal");
    record3.set("ranking", 4);
    record3.set("country", "Spain");
    record3.set("points", 10500);
    record3.set("age", 38);
    record3.set("source", "atp");
    record3.set("profile_url", "https://www.atptour.com/en/players/rafael-nadal");
    record3.set("recent_results", ["L", "W", "L", "W", "L"]);
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    record4.set("name", "Roger Federer");
    record4.set("ranking", 5);
    record4.set("country", "Switzerland");
    record4.set("points", 10000);
    record4.set("age", 53);
    record4.set("source", "atp");
    record4.set("profile_url", "https://www.atptour.com/en/players/roger-federer");
    record4.set("recent_results", ["L", "L", "L", "L", "L"]);
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    record5.set("name", "Daniil Medvedev");
    record5.set("ranking", 6);
    record5.set("country", "Russia");
    record5.set("points", 9500);
    record5.set("age", 28);
    record5.set("source", "atp");
    record5.set("profile_url", "https://www.atptour.com/en/players/daniil-medvedev");
    record5.set("recent_results", ["W", "W", "L", "W", "W"]);
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record6 = new Record(collection);
    record6.set("name", "Stefanos Tsitsipas");
    record6.set("ranking", 7);
    record6.set("country", "Greece");
    record6.set("points", 9000);
    record6.set("age", 26);
    record6.set("source", "atp");
    record6.set("profile_url", "https://www.atptour.com/en/players/stefanos-tsitsipas");
    record6.set("recent_results", ["W", "L", "W", "L", "W"]);
  try {
    app.save(record6);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record7 = new Record(collection);
    record7.set("name", "Iga Swiatek");
    record7.set("ranking", 1);
    record7.set("country", "Poland");
    record7.set("points", 12000);
    record7.set("age", 23);
    record7.set("source", "wta");
    record7.set("profile_url", "https://www.wtatennis.com/players/iga-swiatek");
    record7.set("recent_results", ["W", "W", "W", "W", "L"]);
  try {
    app.save(record7);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record8 = new Record(collection);
    record8.set("name", "Aryna Sabalenka");
    record8.set("ranking", 2);
    record8.set("country", "Belarus");
    record8.set("points", 11500);
    record8.set("age", 26);
    record8.set("source", "wta");
    record8.set("profile_url", "https://www.wtatennis.com/players/aryna-sabalenka");
    record8.set("recent_results", ["W", "W", "L", "W", "W"]);
  try {
    app.save(record8);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record9 = new Record(collection);
    record9.set("name", "Elena Rybakina");
    record9.set("ranking", 3);
    record9.set("country", "Kazakhstan");
    record9.set("points", 11000);
    record9.set("age", 25);
    record9.set("source", "wta");
    record9.set("profile_url", "https://www.wtatennis.com/players/elena-rybakina");
    record9.set("recent_results", ["W", "L", "W", "W", "L"]);
  try {
    app.save(record9);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record10 = new Record(collection);
    record10.set("name", "Coco Gauff");
    record10.set("ranking", 4);
    record10.set("country", "United States");
    record10.set("points", 10500);
    record10.set("age", 20);
    record10.set("source", "wta");
    record10.set("profile_url", "https://www.wtatennis.com/players/coco-gauff");
    record10.set("recent_results", ["W", "W", "W", "L", "W"]);
  try {
    app.save(record10);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record11 = new Record(collection);
    record11.set("name", "Madison Keys");
    record11.set("ranking", 5);
    record11.set("country", "United States");
    record11.set("points", 10000);
    record11.set("age", 29);
    record11.set("source", "wta");
    record11.set("profile_url", "https://www.wtatennis.com/players/madison-keys");
    record11.set("recent_results", ["L", "W", "W", "W", "L"]);
  try {
    app.save(record11);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record12 = new Record(collection);
    record12.set("name", "Jessica Pegula");
    record12.set("ranking", 6);
    record12.set("country", "United States");
    record12.set("points", 9500);
    record12.set("age", 30);
    record12.set("source", "wta");
    record12.set("profile_url", "https://www.wtatennis.com/players/jessica-pegula");
    record12.set("recent_results", ["W", "L", "W", "L", "W"]);
  try {
    app.save(record12);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record13 = new Record(collection);
    record13.set("name", "Marketa Vondrousova");
    record13.set("ranking", 7);
    record13.set("country", "Czech Republic");
    record13.set("points", 9000);
    record13.set("age", 24);
    record13.set("source", "wta");
    record13.set("profile_url", "https://www.wtatennis.com/players/marketa-vondrousova");
    record13.set("recent_results", ["W", "W", "L", "W", "L"]);
  try {
    app.save(record13);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record14 = new Record(collection);
    record14.set("name", "Barbora Krejcikova");
    record14.set("ranking", 8);
    record14.set("country", "Czech Republic");
    record14.set("points", 8500);
    record14.set("age", 29);
    record14.set("source", "wta");
    record14.set("profile_url", "https://www.wtatennis.com/players/barbora-krejcikova");
    record14.set("recent_results", ["L", "W", "W", "W", "W"]);
  try {
    app.save(record14);
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