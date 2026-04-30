/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let records;
  try {
    records = app.findRecordsByFilter("players", "name='Carlos Alcaraz'");
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("No records found, skipping");
      return;
    }
    throw e;
  }
  
  for (const record of records) {
    record.set("bio", "Spanish prodigy and multiple Grand Slam champion. At just 21 years old, he has already achieved what many players dream of. Known for his aggressive playing style, powerful forehand, and exceptional court coverage. His competitive spirit and determination have made him one of the most exciting players in modern tennis.");
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