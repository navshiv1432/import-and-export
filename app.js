const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);

    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,

    stateName: dbObject.state_name,

    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,

    districtName: dbObject.district_name,

    stateId: dbObject.state_Id,

    cases: dbObject.cases,

    active: dbObject.active,

    deaths: dbObject.deaths,
  };
};

//get states

app.get("/states/", async (request, response) => {
  const getStateQuery = `

  SELECT *

  FROM state;`;

  const stateArray = await db.all(getStateQuery);

  response.send(
    stateArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

//get specific state

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateSpecific = `

  SELECT *

  FROM state

  WHERE state_id=${stateId};`;

  const state = await db.get(getStateSpecific);

  response.send(convertStateDbObjectToResponseObject(state));
});

//Add District

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const postDistrictQuery = `

  INSERT INTO

  district(district_name,state_id,cases,active,deaths)

  VALUES('${districtName}',${stateId},${cases},${active},${deaths});`;

  await db.run(postDistrictQuery);

  response.send("District Successfully Added");
});

// get district

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictQuery = `

  SELECT *

  FROM district

  WHERE district_id=${districtId};`;

  const DistrictArray = await db.get(getDistrictQuery);

  response.send(convertDistrictDbObjectToResponseObject(DistrictArray));
});

//Delete district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `

  DELETE FROM 

  district

  where district_id=${districtId};`;

  await db.run(deleteDistrictQuery);

  response.send("District Removed");
});

// add district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const { districtId } = request.params;

  const putDistrictQuery = `

  UPDATE district

  SET 

  district_name='${districtName}',

  state_id=${stateId},

  cases=${cases},

  cured=${cured},

  active=${active},

  deaths=${deaths}

  WHERE district_id=${districtId};`;

  await db.run(putDistrictQuery);

  response.send("District Details Updated");
});

// get state stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStateStatsQuery = `

  SELECT SUM(cases),

  SUM(cured),

  SUM(active),

  SUM(deaths)

  FROM district

  WHERE state_id=${stateId};`;

  const stats = await db.get(getStateStatsQuery);

  response.send({
    totalCases: stats["SUM(cases)"],

    totalCured: stats["SUM(cured)"],

    totalActive: stats["SUM(active)"],

    totalDeaths: stats["SUM(deaths)"],
  });
});

//get statename by districtid

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictIdQuery = `

  SELECT state_id FROM district

  WHERE district_id=${districtId};`;

  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `

  SELECT state_name as stateName FROM state 

  WHERE state_id=${getDistrictIdQueryResponse.state_id};`;

  const getStateName = await db.get(getStateNameQuery);

  response.send(getStateName);
});

module.exports = app;
