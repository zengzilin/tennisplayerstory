/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let records;
  try {
    records = app.findRecordsByFilter("players", "name='Rafael Nadal'");
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("No records found, skipping");
      return;
    }
    throw e;
  }
  
  for (const record of records) {
    record.set("bio", "Spanish clay court master with 14 French Open titles. Known as the King of Clay, Nadal is one of the most successful tennis players in history. His powerful forehand, exceptional footwork, and competitive spirit have made him a legend of the sport. A true champion with an incredible winning record on clay courts.");
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