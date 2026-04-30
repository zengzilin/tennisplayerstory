/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let records;
  try {
    records = app.findRecordsByFilter("players", "name='Dominic Thiem'");
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("No records found, skipping");
      return;
    }
    throw e;
  }
  
  for (const record of records) {
    record.set("bio", "Austrian tennis player and US Open champion. Known for his powerful forehand and exceptional clay court skills. Thiem has proven himself as a Grand Slam winner and a consistent top-10 player. His aggressive baseline game and mental toughness have made him one of Austria's greatest tennis players.");
    try {
      app.save(record);
    } catch (e) {
      if (e.message.includes("Value must be unique")) {
        console.log("Record with unique value already exists, skipping");
      } else {
        throw e;
      }
    }
  }
}, (app) => {
  // Rollback: original values not stored, manual restore needed
})