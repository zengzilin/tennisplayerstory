/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("players");

  const record0 = new Record(collection);
    record0.set("name", "Jannik Sinner");
    record0.set("ranking", 1);
    record0.set("points", 12100);
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
    record1.set("points", 11890);
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
    record2.set("points", 10500);
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
    record3.set("points", 9800);
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
    record4.set("name", "Daniil Medvedev");
    record4.set("ranking", 5);
    record4.set("points", 9200);
    record4.set("country", "Russia");
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
    record5.set("name", "Alexander Zverev");
    record5.set("ranking", 6);
    record5.set("points", 8900);
    record5.set("country", "Germany");
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
    record6.set("name", "Dominic Thiem");
    record6.set("ranking", 7);
    record6.set("points", 8500);
    record6.set("country", "Austria");
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
    record7.set("name", "Matteo Berrettini");
    record7.set("ranking", 8);
    record7.set("points", 8100);
    record7.set("country", "Italy");
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
    record8.set("name", "Andrey Rublev");
    record8.set("ranking", 9);
    record8.set("points", 7800);
    record8.set("country", "Russia");
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
    record9.set("name", "Holger Rune");
    record9.set("ranking", 10);
    record9.set("points", 7500);
    record9.set("country", "Denmark");
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
    record10.set("name", "Taylor Fritz");
    record10.set("ranking", 11);
    record10.set("points", 7200);
    record10.set("country", "USA");
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
    record11.set("name", "Frances Tiafoe");
    record11.set("ranking", 12);
    record11.set("points", 6900);
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
    record12.set("name", "Grigor Dimitrov");
    record12.set("ranking", 13);
    record12.set("points", 6600);
    record12.set("country", "Bulgaria");
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
    record13.set("name", "Hubert Hurkacz");
    record13.set("ranking", 14);
    record13.set("points", 6300);
    record13.set("country", "Poland");
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
    record14.set("name", "Sebastian Korda");
    record14.set("ranking", 15);
    record14.set("points", 6000);
    record14.set("country", "USA");
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

  const record15 = new Record(collection);
    record15.set("name", "Aryna Sabalenka");
    record15.set("ranking", 1);
    record15.set("points", 11025);
    record15.set("country", "Belarus");
    record15.set("source", "wta");
  try {
    app.save(record15);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record16 = new Record(collection);
    record16.set("name", "Iga Swiatek");
    record16.set("ranking", 2);
    record16.set("points", 10500);
    record16.set("country", "Poland");
    record16.set("source", "wta");
  try {
    app.save(record16);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record17 = new Record(collection);
    record17.set("name", "Coco Gauff");
    record17.set("ranking", 3);
    record17.set("points", 9800);
    record17.set("country", "USA");
    record17.set("source", "wta");
  try {
    app.save(record17);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record18 = new Record(collection);
    record18.set("name", "Elena Rybakina");
    record18.set("ranking", 4);
    record18.set("points", 9200);
    record18.set("country", "Kazakhstan");
    record18.set("source", "wta");
  try {
    app.save(record18);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record19 = new Record(collection);
    record19.set("name", "Marketa Vondrousova");
    record19.set("ranking", 5);
    record19.set("points", 8900);
    record19.set("country", "Czech Republic");
    record19.set("source", "wta");
  try {
    app.save(record19);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record20 = new Record(collection);
    record20.set("name", "Karolina Muchova");
    record20.set("ranking", 6);
    record20.set("points", 8500);
    record20.set("country", "Czech Republic");
    record20.set("source", "wta");
  try {
    app.save(record20);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record21 = new Record(collection);
    record21.set("name", "Jasmine Paolini");
    record21.set("ranking", 7);
    record21.set("points", 8100);
    record21.set("country", "Italy");
    record21.set("source", "wta");
  try {
    app.save(record21);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record22 = new Record(collection);
    record22.set("name", "Madison Keys");
    record22.set("ranking", 8);
    record22.set("points", 7800);
    record22.set("country", "USA");
    record22.set("source", "wta");
  try {
    app.save(record22);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record23 = new Record(collection);
    record23.set("name", "Veronika Kudermetova");
    record23.set("ranking", 9);
    record23.set("points", 7500);
    record23.set("country", "Russia");
    record23.set("source", "wta");
  try {
    app.save(record23);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record24 = new Record(collection);
    record24.set("name", "Barbora Krejcikova");
    record24.set("ranking", 10);
    record24.set("points", 7200);
    record24.set("country", "Czech Republic");
    record24.set("source", "wta");
  try {
    app.save(record24);
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