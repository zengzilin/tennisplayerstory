/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let records;
  try {
    records = app.findRecordsByFilter("players", "name='Roger Federer'");
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("No records found, skipping");
      return;
    }
    throw e;
  }
  
  for (const record of records) {
    record.set("bio", "Swiss tennis icon with 20 Grand Slam titles. Widely considered one of the greatest players of all time. Known for his elegant playing style, versatile game, and exceptional shot-making ability. His grace on court and sportsmanship have made him a beloved figure in tennis history.");
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