/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("players");

  const record0 = new Record(collection);
    record0.set("name", "Jannik Sinner");
    record0.set("ranking", 1);
    record0.set("country", "Italy");
    record0.set("source", "atp");
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
    record1.set("source", "atp");
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
    record2.set("source", "atp");
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
    record3.set("source", "atp");
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
    record4.set("source", "atp");
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
    record5.set("source", "atp");
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
    record6.set("name", "Alexander Zverev");
    record6.set("ranking", 7);
    record6.set("country", "Germany");
    record6.set("source", "atp");
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
    record7.set("name", "Dominic Thiem");
    record7.set("ranking", 8);
    record7.set("country", "Austria");
    record7.set("source", "atp");
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
    record8.set("name", "Matteo Berrettini");
    record8.set("ranking", 9);
    record8.set("country", "Italy");
    record8.set("source", "atp");
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
    record9.set("name", "Andrey Rublev");
    record9.set("ranking", 10);
    record9.set("country", "Russia");
    record9.set("source", "atp");
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
    record10.set("name", "Holger Rune");
    record10.set("ranking", 11);
    record10.set("country", "Denmark");
    record10.set("source", "atp");
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
    record11.set("name", "Taylor Fritz");
    record11.set("ranking", 12);
    record11.set("country", "USA");
    record11.set("source", "atp");
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
    record12.set("name", "Frances Tiafoe");
    record12.set("ranking", 13);
    record12.set("country", "USA");
    record12.set("source", "atp");
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
    record13.set("name", "Grigor Dimitrov");
    record13.set("ranking", 14);
    record13.set("country", "Bulgaria");
    record13.set("source", "atp");
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
    record14.set("name", "Hubert Hurkacz");
    record14.set("ranking", 15);
    record14.set("country", "Poland");
    record14.set("source", "atp");
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